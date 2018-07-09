#!/bin/bash

deps=('__.js' 'vv.js' '_vv.js' 'vv_helpers.js' 'vv_ajax.js')

bundle='vv_bundle.js'

echo "bundling..."

echo '/****** vv_bundle ******/' > $bundle

for d in ${deps[*]}
do  
    cat src/$d >> $bundle
    echo "->  $d"
done

echo "...done"
