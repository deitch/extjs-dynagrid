/*global Ext, JSORM */

/**
 * Paging memory proxy, to use for paging from a local memory source
 * The main purpose for this is testing
 */
JSORM.ext.PagingMemoryProxy = Ext.extend(Ext.data.MemoryProxy,{
	constructor : function(config) {
		var data = config;
		if (typeof(config) === "object" && config.url) {
			this.url = config.url;
		}
		JSORM.ext.PagingMemoryProxy.superclass.constructor.call(this,config);
	},
	/**
	 * Need to override the load so it loads only what we want
	 */
	load : function(params, reader, callback, scope, arg) {
        params = params || {};
		arg = arg || {};
        var result, end, url = this.url;
        try {
			// do we have a url configured?
			if (url && !this.urlLoaded) {
				this.urlLoaded = true;
				Ext.Ajax.request({url: url, scope: this, callback: function(options,success,response){
					if (success) {
						// mark the URL as loaded so we do not do it again
						this.urlLoaded = true;
						// keep the data
						this.data = Ext.decode(response.responseText);
						// run the load again, this time with data all ready
						this.load(params,reader,callback,scope,arg);
					} else {
						// we failed, so pass the error message
						callback.call(scope,null,arg,false);
					}
				}});
			}
            result = reader.readRecords(this.data);
			// was it limited?
			if (params.hasOwnProperty("start")) {
				result.records = result.records.slice(params.start,params.hasOwnProperty("limit")?params.start+params.limit:null);
			}
        }catch(e){
            this.fireEvent("loadexception", this, arg, null, e);
            callback.call(scope, null, arg, false);
            return;
        }
        callback.call(scope, result, arg, true);		
	}
});