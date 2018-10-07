#!/bin/bash

deps=('__' 'fst' '_fst' 'elements' 'ajax' 'export')
bundle='bundle.js'
#dir='/home/shevket/js/vv/'

echo '/* forest bundle */' > $(pwd)/$bundle && echo "bundling..."

for d in ${deps[*]}
do  
    cat $(pwd)/src/$d.js >> $(pwd)/$bundle && echo "->  $d.js"
done

echo "...done"
