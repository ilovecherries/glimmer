#!/bin/bash
mkdir -p markup2-esm
cp markup2/*.js markup2-esm
sed -i '' -e 's/^class/export default class/g' markup2-esm/*.js