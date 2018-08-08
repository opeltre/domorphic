#!/bin/bash

deps=('__' 'vv' '_vv' 'vv_helpers' 'vv_ajax')
bundle='vv_bundle.js'
#dir='/home/shevket/js/vv/'

echo '/* vv_bundle */' > $vv/$bundle && echo "bundling..."

for d in ${deps[*]}
do  
    cat $vv/src/$d.js >> $vv/$bundle && echo "->  $d.js"
done

echo "if (typeof window === 'undefined') {\
    module.exports = {vv, _vv, __};\
    }" >> $vv/$bundle

echo "...done"
