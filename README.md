# Dyna-Grid
Dyna-Grid is an extension for ExtJS.

License: Please see the included license file LICENSE.md

## Included Files
* README.md - this file
* LICENSE.md - license requirements
* dyna-grid.js - the actual library
* dyna-grid-src.js - non-minified version of the library

## Installation
Installation is straightforward. Simple include dyna-grid.js in your <script>..</script>
includes on your HTML page. Make sure that `dyna-grid.js` comes *after* any and all `ext-*.js`
files, such as `ext-base.js` and `ext-all.js`.

## Limitations
This only works if the server side that backs the store understands the "start" and "limit" parameters
to a store's load request. See the documentation http://extjs.com/deploy/dev/docs/
for store, specifically the method load(), for more information.

## Overview
Dyna-grid provides the ability to have an infinitely scrolling grid, rather than the paging that ExtJS provides
by default. dyna-grid uses the same underlying store and server side; the entire logic is included in an
extension to the grid and gridview.

When a grid is displayed, many rows are hidden above the top and below the bottom. As the
number of rows hidden goes below a certain margin threshold, the grid asks the store
to retrieve more information via Ajax. The grid then cleans up old rows that are outside the margin.
The net result is a high-performance nearly seamless infinite grid that can scroll up and down through an entire data set.

In order to do the above activities, we have added one extension class:
- `JSORM.ext.DynaGrid` - extends and acts like any `Ext.grid.GridPanel`
`JSORM.ext.DynaGrid` is aliased to `Ext.ux.grid.DynaGrid` for maximum namespace compatibility.

Additionally, a DynaGrid uses a hidden view class:
- `JSORM.ext.DynaGridView` - extends and acts like any `Ext.grid.GridView`

Finally, an extension to Ext.data.MemoryProxy is provided that supports paging, allowing one to test or emulate
server-side paging with an in-memory array:
- `JSORM.ext.PagingMemoryProxy`

## Usage
### DynaGrid
To create a DynaGrid, simply use it in place of an `Ext.grid.GridPanel`. DynaGrid accepts all of the arguments
of GridPanel. The rest is automatic.

```js
var grid = new Ext.ux.grid.DynaGrid({config});
```

DynaGrid has a second usage, in a decorator pattern. If you wish to use a different child of `Ext.grid.GridPanel`
as your grid, DynaGrid can wrap it. In this case, DynaGrid  takes two arguments, the parent class and the
arguments. As long as the parent class properly extends `Ext.grid.GridPanel`, it will work.

```js
var grid = new Ext.ux.grid.DynaGrid(Ext.ux.MyExtensionGrid,{config});
```

Any underlying view is acceptable. In a normal GridPanel, you can either leave the default, or explicitly
add a GridView. DynaGrid's view, a DynaGridView, will intelligently wrap any eligible GridView.

DynaGrid supports one additional configuration option, marginFactor. marginFactor is a number that determines
how much extra margin should be available out of site. For example, if the marginFactor is 1, then
the same number of rows visible in the grid will be hidden out of site both above and below the grid. As
a user scrolls through the rows, when the number of rows hidden would be less than half the margin, DynaGrid
will retrieve more rows for the side (above or below) that will drop below half, while removing rows for the other
side, restoring a balance of `marginFactor * visibleRows` on either side.

### PagingMemoryProxy
PagingMemoryProxy acts exactly like a normal `Ext.data.MemoryProxy`, except that it can handle start and limit
arguments, replicating server-side features. To use it, simply replace a normal `Ext.data.MemoryProxy` with
`JSORM.ext.PagingMemoryProxy`. When you call load with the "start" and "limit" options, `PagingMemoryProxy` will
return the desired records.

The following is a sample configuration:

```js
var Person = Ext.data.Record.create([{name: 'firstName'},{name: 'lastName'},{name: 'address'}]);
var store = new Ext.data.Store({
	proxy: new JSORM.ext.PagingMemoryProxy(someJson),
	reader: new Ext.ux.JsonReader({
		root: 'person'
	},Person)
});
var grid = new JSORM.ext.DynaGrid({
 // normal config options
});
store.load({start: 0, limit: 50});
```

## Server Requirements
There are no special server-side requirements for DynaGrid. If your server side can handle paging requests,
it can handle DynaGrid.
