<template>
  <div></div>
</template>

<style scoped>
.resize-box {
  contain: strict;
  display: flex;
  flex-direction: column;
}
.resize-box > * {
  flex-shrink: 0;
}
.resize-box > .grow {
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: 0;
}
.resize-box > .flex-sized {
  flex-shrink: 1;
  overflow-y: auto;
}
.resize {
  -webkit-touch-callout: none;

  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
  cursor: grab;
  color: var(--databartxtcolor);
  background: var(--databarbgcolor);
  height: 1.2em;
  line-height: 1;
  overflow: hidden;
  /*box-shadow: 0 -2px 3px rgba(0,0,0,0.3);*/
}
.resize[dragging] {
  cursor: grabbing;
}
</style>
