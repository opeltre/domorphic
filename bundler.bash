#!/bin/bash

deps=('__' 'fst' 'elements' 'ajax' 'export')
bundle='bundle.js'
#dir='/home/shevket/js/vv/'

echo '/* forest bundle */' > $vv/$bundle && echo "bundling..."

for d in ${deps[*]}
do  
    cat $vv/src/$d.js >> $vv/$bundle && echo "->  $d.js"
done

echo "...done"
