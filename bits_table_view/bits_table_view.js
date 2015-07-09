import can from "can";
import initView from "./bits_table_view.stache!";
import moment from "moment";

import "./bits_table_view.less!";
import "bit/image-gallery/";
import "bit/body-wrap/";

export default can.Component.extend({
	tag: 'bh-bits-table-view',
	template: initView,
	scope:  {
		init : function(){
			this.attr('groupedBits', {});
			this.groupExistingBits();
		},
		groupExistingBits: function(){
			can.batch.start();

			var bits = this.attr('bits');
			var groupedBits = this.attr('groupedBits');
			var length = bits.attr('length');
			var bit, date;


			for(var i = 0; i < length; i++){
				bit = bits.attr(i);
				date = bit.attr('formattedThreadUpdatedAtDate');
				
				if(!groupedBits.attr(date)){
					groupedBits.attr(date, []);
				}
				groupedBits.attr(date).push(bit);
			}

			can.batch.stop();
		}
	},
	events : {
		"{scope} bits" : function(){
			console.log('aaaaa', arguments)
		}
	},
	helpers: {
		formattedTitle : function(title){
			title = can.isFunction(title) ? title() : title;
			if(title && title !== 'undefined'){
				return title;
			}
			return "";
		},
		formattedDateSeparator: function(date){
			date = can.isFunction(date) ? date() : date;
			return moment(date, 'YYYY-MM-DD').format('MMMM Do, YYYY');
		}
	}
});
