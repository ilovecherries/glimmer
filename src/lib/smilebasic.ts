import type { LanguageFn } from "highlight.js";

export const smilebasic: LanguageFn = (hljs) => {
  const KEYWORDS = [
    "CONTINUE",
    "RESTORE",
    "ELSEIF",
    "COMMON",
    "LINPUT",
    "REPEAT",
    "RETURN",
    "ENDIF",
    "BREAK",
    "FALSE",
    "GOSUB",
    "INPUT",
    "PRINT",
    "UNTIL",
    "WHILE",
    "CALL",
    "DATA",
    "ELSE",
    "EXEC",
    "GOTO",
    "NEXT",
    "READ",
    "STOP",
    "SWAP",
    "THEN",
    "TRUE",
    "WEND",
    "DEC",
    "DEF",
    "DIM",
    "END",
    "FOR",
    "INC",
    "OUT",
    "REM",
    "USE",
    "VAR",
    "IF",
    "ON",
  ];
  const FUNCTIONS = [
    "EXTFEATURE",
    "BACKCOLOR",
    "BACKTRACE",
    "CLIPBOARD",
    "PCMSTREAM",
    "RANDOMIZE",
    "SPHITINFO",
    "BGMCLEAR",
    "BGMPAUSE",
    "BGSCREEN",
    "CHKLABEL",
    "CLASSIFY",
    "GYROSYNC",
    "HARDWARE",
    "MICSTART",
    "MILLISEC",
    "PRGNAME$",
    "RINGCOPY",
    "SPCOLVEC",
    "SPUNLINK",
    "TALKSTOP",
    "BGCOLOR",
    "BGCOORD",
    "BGMCONT",
    "BGMPLAY",
    "BGMPRGA",
    "BGMSETD",
    "BGMSTOP",
    "BGSCALE",
    "BGSTART",
    "BREPEAT",
    "BQPARAM",
    "CALLIDX",
    "CHKCALL",
    "CHKFILE",
    "DISPLAY",
    "DLCOPEN",
    "ERRLINE",
    "FADECHK",
    "FONTDEF",
    "FORMAT$",
    "FREEMEM",
    "GCIRCLE",
    "GPUTCHR",
    "MAINCNT",
    "MICDATA",
    "MICSAVE",
    "MICSIZE",
    "MICSTOP",
    "MPCOUNT",
    "MPLOCAL",
    "MPNAME$",
    "MPSTART",
    "PCMCONT",
    "PCMSTOP",
    "PRGEDIT",
    "PRGGET$",
    "PRGSIZE",
    "PRGSLOT",
    "PROJECT",
    "RGBREAD",
    "SNDSTOP",
    "SPCOLOR",
    "SPHITRC",
    "SPHITSP",
    "SPSCALE",
    "SPSTART",
    "STICKEX",
    "SYSBEEP",
    "TABSTEP",
    "TALKCHK",
    "UNSHIFT",
    "VISIBLE",
    "WAVSETA",
    "XSCREEN",
    "BGANIM",
    "BGCLIP",
    "BGCOPY",
    "BGFILL",
    "BGFUNC",
    "BGHIDE",
    "BGHOME",
    "BGLOAD",
    "BGMCHK",
    "BGMPRG",
    "BGMSET",
    "BGMVAR",
    "BGMVOL",
    "BGPAGE",
    "BGSAVE",
    "BGSHOW",
    "BGSTOP",
    "BIQUAD",
    "BUTTON",
    "CHKCHR",
    "CHKVAR",
    "DELETE",
    "DIALOG",
    "DTREAD",
    "EFCOFF",
    "EFCSET",
    "EFCWET",
    "ERRNUM",
    "ERRPRG",
    "FFTWFN",
    "GCOLOR",
    "GPAINT",
    "GSPOIT",
    "INKEY$",
    "LOCATE",
    "MICPOS",
    "MPHOST",
    "MPRECV",
    "MPSEND",
    "MPSTAT",
    "OPTION",
    "PCMPOS",
    "PCMVOL",
    "PRGDEL",
    "PRGINS",
    "PRGSET",
    "RENAME",
    "RESULT",
    "RIGHT$",
    "SCROLL",
    "SPANIM",
    "SPCLIP",
    "SPFUNC",
    "SPHIDE",
    "SPHOME",
    "SPLINK",
    "SPPAGE",
    "SPSHOW",
    "SPSTOP",
    "SPUSED",
    "SUBST$",
    "TMREAD",
    "VERSON",
    "WAVSET",
    "ACCEL",
    "ARYOP",
    "BGCHK",
    "BGCLR",
    "BGGET",
    "BGOFS",
    "BGPUT",
    "BGROT",
    "BGVAR",
    "COLOR",
    "DATE$",
    "EFCON",
    "FILES",
    "FLOOR",
    "GCLIP",
    "GCOPY",
    "GFILL",
    "GLINE",
    "GLOAD",
    "GPAGE",
    "GPRIO",
    "GPSET",
    "GSAVE",
    "GYROA",
    "GYROV",
    "INSTR",
    "LEFT$",
    "MPEND",
    "MPGET",
    "MPSET",
    "ROUND",
    "RSORT",
    "SHIFT",
    "SPCHK",
    "SPCHR",
    "SPCLR",
    "SPCOL",
    "SPDEF",
    "SPOFS",
    "SPROT",
    "SPSET",
    "SPVAR",
    "STICK",
    "TIME$",
    "TOUCH",
    "VSYNC",
    "WIDTH",
    "ACLS",
    "ACOS",
    "ASIN",
    "ATAN",
    "ATTR",
    "BEEP",
    "BIN$",
    "CEIL",
    "CHR$",
    "COPY",
    "COSH",
    "CSRX",
    "CSRY",
    "CSRZ",
    "FADE",
    "FILL",
    "GBOX",
    "GCLS",
    "GOFS",
    "GTRI",
    "HEX$",
    "IFFT",
    "LOAD",
    "MID$",
    "PUSH",
    "RNDF",
    "SAVE",
    "SINH",
    "SORT",
    "STR$",
    "TALK",
    "TANH",
    "WAIT",
    "XOFF",
    "ABS",
    "ASC",
    "CLS",
    "COS",
    "DEG",
    "EXP",
    "FFT",
    "KEY",
    "LEN",
    "LOG",
    "MAX",
    "MIN",
    "POW",
    "POP",
    "RAD",
    "RGB",
    "RND",
    "SGN",
    "SIN",
    "SQR",
    "TAN",
    "VAL",
    "XON",
  ];
  const OPERATORS = [
    "+",
    "-",
    "*",
    "/",
    "!",
    "<",
    ">",
    "&&",
    "||",
    "<=",
    ">=",
    "==",
    "!=",
    "<<",
    ">>",
  ];
  const WORD_OPERATORS = ["DIV", "MOD", "AND", "OR", "XOR", "NOT"];
  const CONSTANTS = [
    "#BGROT180",
    "#BGROT270",
    "#SPROT180",
    "#SPROT270",
    "#TMAGENTA",
    "#BGROT90",
    "#FUCHSIA",
    "#MAGENTA",
    "#PVRIGHT",
    "#SPROT90",
    "#TMAROON",
    "#TPURPLE",
    "#TROT180",
    "#TROT270",
    "#TYELLOW",
    "#AOPADD",
    "#AOPCLP",
    "#AOPDIV",
    "#AOPLIP",
    "#AOPMAD",
    "#AOPMUL",
    "#AOPSUB",
    "#BGREVH",
    "#BGREVV",
    "#BGROT0",
    "#MAROON",
    "#PURPLE",
    "#PVLEFT",
    "#SILVER",
    "#SPREVH",
    "#SPREVV",
    "#SPROT0",
    "#SPSHOW",
    "#TBLACK",
    "#TGREEN",
    "#TOLIVE",
    "#TROT90",
    "#TWHITE",
    "#WFBLKM",
    "#WFHAMM",
    "#WFHANN",
    "#WFRECT",
    "#YELLOW",
    "#BLACK",
    "#BQAPF",
    "#BQBPF",
    "#BQBSF",
    "#BQHPF",
    "#BQHSF",
    "#BQLPF",
    "#BQLSF",
    "#BQPEQ",
    "#CHKUV",
    "#CHKXY",
    "#GREEN",
    "#OLIVE",
    "#RIGHT",
    "#SPADD",
    "#TBLUE",
    "#TCYAN",
    "#TGRAY",
    "#TLIME",
    "#TNAVY",
    "#TREVH",
    "#TREVV",
    "#TROT0",
    "#TTEAL",
    "#WHITE",
    "#FALSE",
    "#AQUA",
    "#BLUE",
    "#CHKC",
    "#CHKI",
    "#CHKR",
    "#CHKS",
    "#CHKV",
    "#CHKZ",
    "#CYAN",
    "#DOWN",
    "#GRAY",
    "#LEFT",
    "#LIME",
    "#NAVY",
    "#TEAL",
    "#TRED",
    "#TRUE",
    "#OFF",
    "#RED",
    "#YES",
    "#NO",
    "#ON",
    "#UP",
    "#ZL",
    "#ZR",
    "#A",
    "#B",
    "#L",
    "#R",
    "#X",
    "#Y",
  ];
  return {
    name: "SmileBASIC",
    case_insensitive: true,
    keywords: {
      keyword: KEYWORDS.concat(WORD_OPERATORS),
      literal: FUNCTIONS,
      _relevance_only: CONSTANTS,
    },
    contains: [
      hljs.QUOTE_STRING_MODE,
      hljs.COMMENT("'", "$", { relevance: 0 }),
    ],
  };
};