/*global Ext, JSORM */
/**
 * Dynamic Grid View
 */
JSORM.ext.DynaGridView = function(parent,config) {
	var superclass = parent.constructor.prototype, that = parent, store;
	var rowHeight = -1, visibleRows = 0, margin = 0, marginFactor = 0.5, limit = 0, maxScrollTop = -1, sb = null, firstRow = -1;
	var minChange, oldStart = -1, oldFinish = -1, tmpStart = -1, tmpFinish = -1;
	var scrollHandler, calcFirstRow, calcDimensions, setPadding, reorderStore, load, startTime;
	
	calcDimensions = function() {
		var r1 = this.getRow(0);
		// only do it if we have a row 0 and it has some height
		if (r1 && r1.offsetHeight>0) {
			sb = this.scroller.dom;
			store = this.grid.getStore();
			rowHeight = r1.offsetHeight;

			// set the height of the inside element to be the # of rows * the total rows. This ensures the scrollbar
			//   works correctly
			this.mainBody.setHeight(rowHeight*store.getTotalCount());

			// what is the maximum for the scroll top? The minimum is obviously zero
			maxScrollTop = sb.scrollHeight - sb.offsetHeight;

			visibleRows = Math.ceil(sb.offsetHeight/rowHeight);
			
			// the margin before and after is always marginFactor * number of rows we are showing 
			margin = Math.floor(visibleRows * marginFactor);
			// the minimum change to load new is half the margin
			minChange = 0.5*margin;

			// the limit is number the of rows to retrieve,
			//    which is just the visibleRows + 2*margin (1/2 before, 1/2 after)
			limit = visibleRows + 2*margin;

		}
	};

	setPadding = function(force) {
		// we need to pad the first firstRow * rowHeight pixels
		var r = this.getRow(0), pad;
		// do we have a valid rowHeight? if not, calculate it
		if (rowHeight <= 0 || force) {
			calcDimensions.call(this);
		}
		if (rowHeight >0 && firstRow >=0 && r) {
			Ext.get(r).setStyle("padding-top",firstRow*rowHeight+'px');
		}
	};
	
	calcFirstRow = function() {
		var top, pct, totalCount, middleRow;
		
		// do we have a valid rowHeight? if not, calculate it
		if (rowHeight <= 0) {
			calcDimensions.call(this);
		}
		// we will need the totalCount several times
		totalCount = store.getTotalCount();
		// top and bottom of the scroll
		top = sb.scrollTop;
		// what percentage down are we?
		pct = top/maxScrollTop;
		// which row do we start with?
		// first figure out which row should be in the middle of the visible space
		middleRow = Math.floor(pct*(totalCount-visibleRows)+0.5*visibleRows);
		// now set the firstRow as middleRow-limit/2
		// it is max of (the first row minus the margin or 0)
		firstRow = Math.max(Math.floor(middleRow-limit/2),0);
		firstRow = Math.min(totalCount-limit,firstRow);
		
		//console.log("top "+ top + " maxScrollTop "+maxScrollTop+" "+Math.round(pct*100*100)/100+"% margin "+margin+" firstRow "+firstRow + " limit "+limit);
	};
	
	load = function() {
		// do we have a range defined?
		var newStart, newLimit, i, len, optadd = true, start = firstRow, finish = start+limit, optadd = true, options = {}, rec;

		// is this the first time we are running a load?
		if (oldStart === -1) {
			// if given, it is zero, else all of it
			oldStart = start !== null && start > -1 ? start : 0;
			optadd = false;
		} else if (oldFinish === -1) {
			// first time we are running after a load?
			oldFinish = store.getCount();
		}

		// 1) Figure out where our new start and limit are 
		
		// is our new starting point within our old range?
		if (start < oldStart || start >= oldFinish) {
			newStart = start;
		} else {
			newStart = oldFinish;
		}
		// where is our new ending point?
		if (finish > oldFinish || finish <= oldStart) {
			newLimit = finish-newStart;
		} else {
			newLimit = oldStart - start;
		}
		
		//console.log("newStart:newLimit "+newStart+":"+newLimit+" minChange "+minChange*this.getCount()+" total "+this.getTotalCount());

		// we do not continue the load if one of the following is true:
		// 1) we have fewer than minChange*store.getCount() to load
		//     caveats: we still load if: 
		//     (a) we will reach the end of the store or (b) we are at the beginning of the store
		// 2) we have fewer than 1 to load 
		
		if (
			(newLimit<minChange && 
			newStart+newLimit<store.getTotalCount() &&
			newStart !== 0) || 
			newLimit < 1) {
			// we already have all the data we need - do not load anything else, just remove rows
			return(true);
		} else {
			// 2) Remove anything outside of that range
			// remove first (start-oldStart) entries
			if (oldStart > -1) {
				for (i=oldStart; i<start;i++) {
					rec = store.getAt(0);
					store.remove(rec);
				}					
			}
			for (i=finish; i<oldFinish;i++) {
				rec = store.getAt(store.getCount()-1);
				store.remove(rec);
			}

			// we want to know where we started and where we ended
			tmpStart = start;
			tmpFinish = start+limit;
				
			// tell the store to load precisely the rows we want
			//console.log("start " + newStart + " limit " + newLimit);
			options.params = {};
			options.params[store.paramNames.start] = newStart;
			options.params[store.paramNames.limit] = newLimit;
			options.add = optadd;
			store.load(options);			
			console.log("loaded in "+(new Date().getTime() - startTime) + " ms");
		}
	};
	
	scrollHandler = function() {
		// which rows do we render?
		startTime = new Date().getTime();
		calcFirstRow.call(this); 
		load.call(this);		
	};

	/*
	 * Reorder the store appropriately after a load
	 */
	reorderStore = function(store,records,options) {
		var i, len, rec, incr;
		/*
		 * compare oldStart to tmpStart and oldFinish to tmpFinish, then reset them.
		 * the new records will always be added at the end, or replace the set entirely.
		 * there are several possibilities:
		 * 1) tmpStart < oldStart: take from (oldFinish-oldStart) to the end, and move them to the beginning
		 * 2) tmpStart > oldStart: all new records should be at the end
		 * 3) Future: tmpStart < oldStart and tmpFinish > oldFinish: new records envelope old
		 */
		
		// record what the last load start was
		if (oldStart === -1 && options && options.params && options.params.start !== undefined) {
			oldStart = options.params.start;
			tmpStart = oldStart;
		}
		// 1) all new records should actually go at the beginning
		if (tmpStart !== -1 && tmpStart<oldStart) {
			// skip the first records, jump to the end
			incr = store.getCount()-records.length;
			for (i=0,len=records.length;i<len;i++) {
				rec = store.data.removeAt(i+incr);
				store.data.insert(i,rec);
			}
		} else {
			// 2) all new records should stay at the end, do nothing
		}
		
		// reset oldStart and oldFinish for the next call
		oldStart = tmpStart;
		oldFinish = tmpFinish;
		
		// report that the data has changed
		store.fireEvent('datachanged',store);
		return(true);
	};
	
	
	Ext.apply(this,{
		_DynaGridView : true,
		init : function(grid){
			superclass.init.call(this, grid);
			this.grid.on('bodyscroll', scrollHandler, this);
			this.grid.on('afterlayout',setPadding.createDelegate(this,[true]));
			this.grid.on('resize',setPadding.createDelegate(this,[true]));
			this.grid.on('bodyresize',setPadding.createDelegate(this,[true]));
			
		},

		/**
		 * Need to make sure that a store loaded *prior* to our instantiation is properly handled
		 */
		initData : function(ds,cm) {
			// call the parent function
			parent.constructor.prototype.initData.apply(parent,arguments);
			// record what the last load start was
			if (ds && ds.lastOptions && ds.lastOptions.params && ds.lastOptions.params.start !== undefined) {
				oldStart = ds.lastOptions.params.start;
				tmpStart = oldStart;
			}
		},
				
		/**
		 * Override the default onLoad function so we do not scroll to the top, and make sure there is enough padding
		 */
		onLoad : function(store, records, options) {
			reorderStore(store,records,options);
			setPadding.call(this);
		},
		
		/**
		 * Override the afterRender to ensure our padding is there
		 */
		afterRender : function() {
			var ret = parent.constructor.prototype.afterRender.apply(parent,arguments);
			setPadding.call(this);
			return(ret);
		},
		/**
		 * Reset our marginfactor to something else
		 */
		setMarginFactor : function(factor) {
			if (typeof(factor) === "number" && factor > -1) {
				marginFactor = factor;
			}
		} 
	});
	Ext.apply(parent,this);
		
	
	return(parent);
};
