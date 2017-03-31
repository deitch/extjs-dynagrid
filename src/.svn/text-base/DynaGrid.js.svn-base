/*global Ext, JSORM */
/**
 * Dynamic Grid
 */
JSORM.ext.DynaGrid = function(parent,config) {
	// accept a parent to use, or use the default
	if (typeof(parent) !== "function") {config = parent; parent = Ext.grid.GridPanel;}
	var superclass = parent;

	// make sure the config is an object
	config = config || {};

	var w = Ext.extend(parent,{
	    getView : function() {
			// make sure we have a view, and it must be a DynaGridView
	        if(!this.view){
	            this.view = new Ext.grid.GridView(this.viewConfig);
			}
			if (!this.view._DynaGridView){
				this.view = new JSORM.ext.DynaGridView(this.view);
				this.view.setMarginFactor(config.marginFactor);
	        }
	        return this.view;
	    }		
	});
	superclass = w.superclass;
	return(new w(config));
};
// for Ext.ux compatibility
Ext.ux.grid.DynaGrid = JSORM.ext.DynaGrid;


