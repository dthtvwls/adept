Adept
=====

[![Greenkeeper badge](https://badges.greenkeeper.io/dthtvwls/adept.svg)](https://greenkeeper.io/)

This is a JavaScript app that loads giant (1M+) data sets into the browser for dynamic analysis and charting.

How to use
----------

Set up an HTTP server to serve public/. If you have node/npm you can `npm install && npm start`

main.js looks for a JSON file at public/raw.json. The data in this file is going to be an array of Plain Old JavaScript Objects. Columns in the spreadsheet will be set up based on the key names of the first member of this array.

Filtering/searching and grouping abilities are going to be established by the data type of that first array member. These states are controlled by the text inputs at the top, conveniently labeled "Filter by" and "Group by".

The spreadsheet can be sorted by clicking on column headers. Hold down ctrl/cmd to sort by multiple keys at once.

When you have a view of data you would like to chart, click and drag to place a selection box around it. Then, right-click/cmd-click to open a context menu and select "Open chart".

Bon appetit!
