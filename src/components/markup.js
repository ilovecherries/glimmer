export const Markup = {
	set INJECT(fn) { fn(this) },
	parse: null,
	render: null,
	convert(text) {
		let tree = this.parse(text)
		return this.render(tree)
	},
}

Markup.INJECT = Markup=>{
	"use strict"
	
	let tree, current, brackets
	
	// maybe instead of this separate parse step, we should just do something like
	// go back to using ex: /^><args>?[{ ]/
	// have either
	// - custom post-processing regex for each token (ex /[\\](\w+)(<args>)?({)?/ )
	// - include these extra groups in the main regex, remove the () group, and find a replacement for the () indexOf("") system
	

	
	Markup.IS_BLOCK = {code:1, line:1, ROOT:1, heading:1, quote:1, table:1, table_cell:1}
	
	// if cancelled, will be completed instead:
	let AUTO_CLOSE = {heading:1, quote:1, ROOT:1}
	// will be cancelled at the end of a block, if open:
	let WEAK = {style:1}
	// cancelled at end of a line (or completed if auto_close is set):
	let END_AT_EOL = {heading:1, style:1, quote:1}
	
	// argtype
	let ARGS_NORMAL   = /(?:\[([^\]\n]*)\])?({)?/y      // [...]?{?
	let ARGS_HEADING  = /(?:\[([^\]\n]*)\])?(?: |({))/y // [...]?( |{)
	let ARGS_BODYLESS = /(?:\[([^\]\n]*)\])?/y          // [...]?
	let ARGS_TABLE    = /(?:\[([^\]\n]*)\])? */y        // [...]? *
	
	/* NOTE:
		/^/ matches after a <newline> or <env> token
		/$/ matches end of string
		/(?![^\n])/ matches end of line
		/()/ empty tags are used to mark token types
	*/
	// ⚠ The order of these is important!
	let [regex, groups] = process_def([[
		// 💎 NEWLINE 💎
		/\n/,
		{newline:true, do(tag) {
			while (!current.body && END_AT_EOL[current.type])
				CANCEL()
			return TEXT(true)
		}},
	],[// 💎 HEADING 💎
		/^#{1,4}/,
		{argtype:ARGS_HEADING, do(tag, rargs, body) {
			let level = /#*/.exec(tag)[0].length // hhhhh
			let args = {level}
			// todo: anchor name (and, can this be chosen automatically based on contents?)
			return OPEN('heading', tag, args, body)
		}},
	],[// 💎 DIVIDER 💎
		/^---+(?![^\n])/,
		{do(tag) {
			return TAG('divider', tag)
		}},
	],[// 💎💎 STYLE
		/(?:[*][*]|__|~~|[/])(?=\w()|)/, //todo: improve these
		// 💎 STYLE START 💎
		{do(tag) {
			return OPEN('style', tag)
		}},
		// 💎 STYLE END 💎
		{do(tag) {
			// todo: should be checking for WEAK here?
			while (current.type=='style') { 
				if (current.tag == tag) { // found opening
					current.type = {
						"**": 'bold',
						"__": 'underline',
						"~~": 'strikethrough',
						"/": 'italic',
					}[current.tag]
					return CLOSE()
				}
				CANCEL() // different style (kill)
			}
			return TEXT(tag)
		}},
	],[// 💎 ENV 💎
		/[\\]\w+/,
		{argtype:ARGS_NORMAL, do(tag, rargs, body) {
			let envtype = /^[\\](\w+)/.exec(tag)[1] //todo: use this
			let args = {}
			return OPEN('env', tag, args, body)
		}},
	],[// 💎 BLOCK END 💎
		//[/{/, {token:''}], // maybe
		/}/,
		{do(tag) {
			if (brackets<=0)
				return TEXT(tag)
			while (!current.body)
				CANCEL()
			return CLOSE()
		}},
	],[// 💎 NULL ENV 💎
		/[\\]{/,
		{body:true, do(tag) {
			return OPEN('null_env', tag, null, true)
		}},
	],[// 💎 ESCAPED CHAR 💎
		/[\\][^]/, //todo: match surrogate pairs
		{do(tag) {
			if (tag=="\\\n")
				return TEXT(true)
			return TEXT(tag.substr(1))
		}},
	],[// 💎 QUOTE 💎
		/^>/,
		{argtype:ARGS_HEADING, do(tag, rargs, body) {
			return OPEN('quote', tag, {cite: rargs[0]}, body)
		}},
	],[// 💎 CODE BLOCK 💎
		/^```[^]*?\n(?:```|$)/,
		{do(tag) {
			return TAG('code', tag, {text: tag.replace(/^```\n?|\n?```$/g,"")}) // hack...
		}},
	],[// 💎 INLINE CODE 💎
		/`[^`\n]+`?/,
		{do(tag) {
			return TAG('icode', tag, {text: tag.replace(/^`|`$/g,"")})
		}},
	],[// 💎💎 URL
		/(?:!())?(?:https?:[/][/]|sbs:)[-\w./%?&=#+~@:$*',;!)(]*[-\w/%&=#+~@$*';)(]/,
		// 💎 EMBED 💎
		{argtype:ARGS_BODYLESS, do(tag, rargs, body) {
			let url = /^!([^[{]*)/.exec(tag)[1]
			let type = embed_type(rargs, url)
			let args = {
				url: filter_url(url),
				alt: rargs.named.alt,
			}
			if (type=='image' || type=='video') {
				match_args(rargs, [
					[/^(\d+)x(\d+)$/, ([,x,y])=>{
						args.width = +x
						args.height = +y
					}]
				])
			}
			return TAG(type, tag, args)
		}},
		// 💎 LINK 💎
		{argtype:ARGS_NORMAL, do(tag, rargs, body) {
			let url = /^([^[{]*)/.exec(tag)[1] //todo: this is a hack
			let args = {url: filter_url(url)}
			if (body)
				return OPEN('link', tag, args, true)
			args.text = rargs.length>0 ? rargs[0] : url
			return TAG('simple_link', tag, args)
		}},
	],[// 💎 TABLE - NEXT ROW 💎
		/ *[|] *\n[|]/,
		{argtype:ARGS_TABLE, do(tag, rargs, body) {
			kill_weak()
			if (current.type!='table_cell')
				return TEXT(tag)
			let args = table_args(rargs)
			return (
				CLOSE(), // cell
				CLOSE(), // row
				OPEN('table_row', ""),
				OPEN('table_cell', tag.replace(/^ *\n/, ""), args, body))
		}},
	],[// 💎 TABLE - END 💎
		/ *[|] *(?![^\n])/,
		{do(tag) {
			kill_weak()
			if (current.type!='table_cell')
				return TEXT(tag) // todo: wait, if this happens, we just killed all those blocks even though this tag isn't valid ??
			return (
				CLOSE(),
				CLOSE(),
				CLOSE())
		}},
	],[// 💎 TABLE - START 💎
		/^ *[|]/,
		{argtype:ARGS_TABLE, do(tag, rargs, body) {
			let args = table_args(rargs)
			return (
				OPEN('table', ""),
				OPEN('table_row', ""),
				OPEN('table_cell', tag, args, body))
		}},
	],[// 💎 TABLE - NEXT CELL 💎
		/ *[|]/,
		{argtype:ARGS_TABLE, do(tag, rargs, body) {
			kill_weak()
			if (current.type!='table_cell')
				return TEXT(tag)
			let args = table_args(rargs)
			return (
				CLOSE(), // cell
				OPEN('table_cell', tag.replace(/^ *[|]/, ""), args, body))
		}},
	]])
	//[/^ *- /, 'list'], TODO
	

	
	function process_def(table) {
		let regi = []
		let groups = []
		for (let [regex, ...matches] of table) {
			regi.push(regex.source+"()")
			groups.push(...matches)
		}
		let r = new RegExp(regi.join("|"), 'g')
		return [r, groups]
	}
	
	let null_args = []
	null_args.named = Object.freeze({})
	Object.freeze(null_args)
	function parse_args(arglist) {
		if (!arglist) // note: tests for undefined (\tag) AND "" (\tag[])
			return null_args
		
		let map = {}, list = []
		for (let arg of arglist.split(";")) {
			let [, name, value] = /^(?:([^=]*)=)?(.*)$/.exec(arg)
			if (name==undefined || name=="") // value or =value (this is to allow values to contain =. ex: [=1=2] is "1=2"
				list.push(value)
			else // name=value
				map[name] = value
		}
		list.named = map
		return list
	}
	function filter_url(url) {
		if (/^ *javascript:/i.test(url))
			return ""
		return url
	}
	function embed_type(rargs, url) {
		let type
		for (let arg of rargs)
			if (arg=='video' || arg=='audio' || arg=='image')
				type = arg
		if (type)
			return type
		if (/[.](mp3|ogg|wav)(?!\w)/i.test(url))
			return 'audio'
		if (/[.](mp4|mkv|mov)(?!\w)/i.test(url))
			return 'video'
		if (/^(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w\-_]+)\&?/.test(url))
			return 'youtube'
		return 'image'
	}
	function match_args(rargs, defs) {
		for (let arg of rargs)
			for (let [regex, func] of defs) {
				let m = regex.exec(arg)
				if (m) {
					func(m)
					break
				}
			}
	}
	function table_args(rargs) {
		let ret = {}
		match_args(rargs, [
			// should this be * or # or h ?  // perhaps # = heading applied to entire row?
			[/^[*]$/, ()=>{
				ret.header = true
			}],
			[/^(?:red|orange|yellow|green|blue|purple|gray)$/, ([color])=>{
				ret.color = color
			}],
			[/^(\d*)x(\d*)$/, ([,w,h])=>{
				if (+w > 1) ret.colspan = +w
				if (+h > 1) ret.rowspan = +h
			}]
		])
		return ret
	}
	
	// start a new block
	function OPEN(type, tag, args, body) {
		current = {type, tag, content: [], parent: current}
		if (body) {
			brackets++
			current.body = true
		}
		if (args)
			current.args = args
	}
	// move up
	function pop() {
		if (current.body)
			brackets--
		let o = current
		current = current.parent
		return o
	}
	// complete current block
	function CLOSE() {
		// push the block + move up
		let o = pop()
		if (o.type=='null_env') // special case: merge
			current.content.push(...o.content)
		else {
			delete o.parent // remove cyclical reference before adding to tree
			current.content.push(o)
		}
	}
	// cancel current block (flatten)
	function CANCEL() {
		if (current.body || AUTO_CLOSE[current.type])
			return CLOSE()
		let o = pop()
		// if we just cancelled a table cell,
		// we don't want to insert text into the table row/body,
		// so we complete the table first.
		if (o.type=='table_cell') {
			current.content.length ? CLOSE() : CANCEL() // row
			current.content.length ? CLOSE() : CANCEL() // table
		}
		// push the start tag (as text)
		TEXT(o.tag) // todo: merge with surrounding text nodes?
		// push the contents of the block
		current.content.push(...o.content)
	}
	// push text
	function TEXT(text) {
		if (text)
			current.content.push(text)
	}
	// push empty tag
	function TAG(type, tag, args) {
		current.content.push({type, tag, args})
	}
	function kill_weak() {
		while (WEAK[current.type])
			CANCEL()
	}
	
	Markup.parse = function(text) {
		current = tree = {type:'ROOT', tag:"", content:[]}
		brackets = 0
		
		let last = regex.lastIndex = 0
		for (let match; match=regex.exec(text); ) {
			// text before token
			TEXT(text.substring(last, match.index))
			// get token
			let group = match.indexOf("", 1)-1
			let thing = groups[group]
			// parse args and {
			let body
			let argregex = thing.argtype
			if (argregex) {
				argregex.lastIndex = regex.lastIndex
				let argmatch = argregex.exec(text)
				if (!argmatch) { // INVALID! skip 1 char, try again
					regex.lastIndex = match.index+1
					last = match.index
					continue
				}
				body = argmatch[2]
				thing.do(match[0]+argmatch[0], parse_args(argmatch[1]), body)
				last = regex.lastIndex = argregex.lastIndex
			} else {
				body = thing.body
				thing.do(match[0])
				last = regex.lastIndex
			}
			// start of line
			if (thing.newline || body) {
				text = text.substring(last)
				//text = RegExp['$\'']
				last = regex.lastIndex = 0
			}
		}
		TEXT(text.substring(last))
		
		while (current.type!='ROOT')
			CANCEL()
		return tree
	}
	
	// what if you want to write like, "{...}". well that's fine
	// BUT if you are inside a tag, the } will close it.
	// maybe closing tags should need some kind of special syntax?
	// \tag{ ... \}  >{...\} idk..
	// or match paired {}s :  
	// \tag{ ...  {heck} ... } <- closes here
	
}

Markup.INJECT = Markup=>{
	"use strict"
	
	// This tag-function parses an HTML string, and returns a function
	//  which creates a copy of that HTML DOM tree when called.
	// ex: let create = 𐀶`<div></div>` 
	//  - create() acts like document.createElement('div')
	// (if there are multiple elements, it returns a DocumentFragment)
	function 𐀶([html]) {
		let temp = document.createElement('template')
		temp.innerHTML = html
		let fragment = temp.content
		let first = fragment.firstChild
		// if the fragment only has 1 node in it, use that instead
		if (!first.nextSibling && !first.firstChild)
			fragment = first
		
		return fragment.cloneNode.bind(fragment, true)
	}
	
	function id(elem, id) {
		let e = elem.getElementById(id)
		e.removeAttribute('id')
		return e
	}
	
	let CREATE = {
		newline: 𐀶`<br>`,
		
		divider: 𐀶`<hr>`,
		
		env: 𐀶`<hr>`,
		
		code: function({text, lang}) {
			let e = this()
			e.textContent = text
			return e
		}.bind(𐀶`<pre>`),
		// .bind(value) makes that value accessible as `this` inside the function, when it's called. (note that the value is only evaluated once)
		// I'm just using this as a simple trick to store the html templates with their init functions, but there's no special reason to do it this way
		
		icode: function({text}) {
			let e = this()
			e.textContent = text.replace(/ /g, " ")
			return e
		}.bind(𐀶`<code>`),
		
		simple_link: function({url, text}) {
			let e = this()
			e.textContent = text
			e.href = url
			return e
		}.bind(𐀶`<a href="">`),
		
		image: function({url, alt, width, height}) {
			let e = this()
			e.src = url
			e.onerror = e.onload = e.removeAttribute.bind(e, 'loading')
			if (alt!=null) e.alt = alt
			if (width) e.width = width
			if (height) e.height = height
			return e
		}.bind(𐀶`<img data-loading data-shrink tabindex=-1>`),
		
		error: 𐀶`<div class='error'><code>🕯error🕯</code>🕯message🕯<pre>🕯stack🕯`,
		// todo: we need a preview flag which disables these because they're very slow... invalid images are bad too.
		audio: function({url}) {
			let e = this()
			e.src = url
			return e
		}.bind(𐀶`<audio controls preload=none>`),
		
		video: function({url}) {
			let e = this()
			e.src = url
			return e
		}.bind(𐀶`<video controls preload=none>`),
		
		italic: 𐀶`<i>`,
		
		bold: 𐀶`<b>`,
		
		strikethrough: 𐀶`<s>`,
		
		underline: 𐀶`<u>`,
		
		heading: function({level}) {
			return this[level-1]()
		}.bind([𐀶`<h1>`,𐀶`<h2>`,𐀶`<h3>`,𐀶`<h4>`]),
		
		quote: function({cite}) {
			if (cite==null)
				return this[0]()
			let e = this[1]()
			id(e, 'cite').textContent = cite
			return e
		}.bind([𐀶`<blockquote>`, 𐀶`<blockquote><cite id=cite>`]),
		
		table: function() {
			let e = this()
			e.B = id(e, 'branch')
			return e
		}.bind(𐀶`<table><tbody id=branch>`),
		
		table_row: 𐀶`<tr>`,
		
		table_cell: function({header, color, truecolor, colspan, rowspan, align}) {
			let e = this[header?1:0]()
			if (color) e.dataset.bgcolor = color
			if (truecolor) e.style.backgroundColor = truecolor
			if (colspan) e.colSpan = colspan
			if (rowspan) e.rowSpan = rowspan
			if (align) e.style.textAlign = align
			return e
		}.bind([𐀶`<td>`,𐀶`<th>`]),
		
		link: function({url}) {
			let e = this()
			e.href = url
			return e
		}.bind(𐀶`<a target=_blank href=""></a>`),
		
		list: function({style}) {
			if (style==null)
				return this[0]()
			let e = this[1]()
			e.style.listStyleType = style
			return e
		}.bind([𐀶`<ul>`, 𐀶`<ol>`]),
		
		list_item: 𐀶`<li>`,
		
		align: function({align}) {
			let e = this()
			e.style.textAlign = align
			return e
		}.bind(𐀶`<div>`),
		
		subscript: 𐀶`<sub>`,
		
		superscript: 𐀶`<sup>`,
		
		anchor: function({name}) {
			let e = this()
			e.name = "_anchor_"+name
			return e
		}.bind(𐀶`<a name="">`),
		
		ruby: function({text}) {
			let e = this()
			id(e, 'top').textContent = text
			e.B = id(e, 'branch')
			return e
		}.bind(𐀶`<ruby><span id=branch></span><rp>(<rt id=top><rp>(`),
		
		spoiler: function({label}) {
			e = this()
			id(e, 'btn').onclick = function() {
				this.toggleAttribute('data-show')
				// could toggle attribute on branch instead?
			}
			e.B = id(e, 'branch')
			return e
		}.bind(𐀶`<button class=spoiler-button id=button></button><div id=branch>`),
		
		background_color: function({color}) {
			let e = this()
			if (color)
				e.dataset.bgcolor = color
			return e
		}.bind(𐀶`<span>`),
	}
	
	function fill_branch(branch, leaves) {
		// children
		let prev = 'newline'
		let all_newline = true
		for (let leaf of leaves) {
			if (typeof leaf == 'string') {
				all_newline = false
				branch.append(leaf)
				prev = 'text'
			} else if (leaf == true) {
				if (prev!='block')
					branch.append(CREATE.newline())
				prev = 'newline'
			} else {
				all_newline = false
				let node = CREATE[leaf.type](leaf.args)
				let new_branch = node.B || node
				branch.append(node)
				if (leaf.content)
					prev = fill_branch(new_branch, leaf.content)
				else
					prev = 'text'
				prev = Markup.IS_BLOCK[leaf.type] ? 'block' : prev
			}
		}
		if (prev=='newline' && !all_newline)
			branch.append(CREATE.newline())
		
		return prev
	}
	
	Markup.render = function(tree) {
		let root = document.createDocumentFragment()
		fill_branch(root, tree.content)
		return root
	}
	
	Markup.create = CREATE
}
