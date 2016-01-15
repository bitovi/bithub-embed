import can from "can/";
import moment from "moment";
import "can/map/define/";
import derive from "can-derive";

console.log('DERIVE', derive);

var Bit = can.Model.extend({
	resource : '/api/v3/embeds/{hubId}/entities',
}, {
	define : {
		thread_updated_at: {
			set : function(val){
				var momentThreadUpdatedAt = moment(val);
				this.attr({
					formattedThreadUpdatedAt: momentThreadUpdatedAt.format('LL'),
					formattedThreadUpdatedAtDate: momentThreadUpdatedAt.format('YYYY-MM-DD')
				});
				return val;
			}
		}
	},
	isTumblrImage : function(){
		return this.isPhoto() && this.isTumblr();
	},
	isInstagramImage : function(){
		return this.isPhoto() && this.attr('feed_name') === 'instagram';
	},
	isPhoto : function(){
		return this.attr('type_name') === 'photo';
	},
	isTumblr : function(){
		return this.attr('feed_name') === 'tumblr';
	},
	isTwitterFollow : function(){
		return this.attr('feed_name') === 'twitter' && this.attr('type_name') === 'follow';
	},
	isYoutube : function(){
		return this.attr('feed_name') === 'youtube';
	},
	youtubeEmbedURL : function(){
		return this.attr('url').replace(/watch\?v=/, 'embed/');
	}
});

Bit.ACTIONS = ['pin', 'unpin', 'approve', 'disapprove'];

var makeBitAction = function(action){
	var templateUrl = '/api/v3/embeds/{hubId}/entities/{id}/' + action;
	return function(hubId){
		var url = can.sub(templateUrl, {
			hubId : hubId,
			id : this.attr('id')
		});

		return $.ajax(url, {
			dataType: 'json',
			type: 'PUT'
		}).then(function(data){
			Bit.model(data);
		});
	};
};

for(var i = 0; i < Bit.ACTIONS.length; i++){
	Bit.prototype[Bit.ACTIONS[i]] = makeBitAction(Bit.ACTIONS[i]);
}

/*Bit.List = Bit.List.extend({
	filter: derive.List.prototype.filter
});*/

export default Bit;
