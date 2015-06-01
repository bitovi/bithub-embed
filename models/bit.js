import can from "can/";
import moment from "moment";

var Bit = can.Model.extend({
	resource : '/api/v3/embeds/{hubId}/entities',
}, {
	formattedThreadUpdatedAt : function(){
		return moment(this.attr('thread_updated_at')).format('LL');
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

export default Bit;
