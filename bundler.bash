#!/bin/bash

deps=('__.js' 'vv.js' '_vv.js' 'vv_helpers.js' 'vv_ajax.js')
bundle='vv_bundle.js'
#dir='/home/shevket/js/vv/'

echo '/* vv_bundle */' > $vv/$bundle && echo "bundling..."

for d in ${deps[*]}
do  
    cat $vv/src/$d >> $vv/$bundle && echo "->  $d"
done

echo "...done"
