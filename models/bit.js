import can from "can/";
import moment from "moment";

import "can/map/define/";

var Bit = can.Model.extend({
	resource : '/api/v4/embeds/{hubId}/entities',
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

Bit.DECISIONS = ['pending', 'starred', 'deleted', 'approved'];

var makeBitAction = function(decision){
	var templateUrl = '/api/v4/embeds/{hubId}/entities/{id}/decide/?decision={decision}';
	return function(hubId){
		var realDecision = decision;
		var currentDecision = this.attr('decision');
		
		if(decision === currentDecision){
			realDecision = 'pending';
		}

		var url = can.sub(templateUrl, {
			hubId : hubId,
			id : this.attr('id'),
			decision: realDecision
		});

		return $.ajax(url, {
			dataType: 'json',
			type: 'PUT'
		}).then(function(data){
			can.trigger(Bit, 'decision', [currentDecision, realDecision]);
			var bit = Bit.model(data);
			bit.updated();
		});
	};
};

var makeBitIsDecision = function(decision){
	return function(){
		return this.attr('decision') === decision;
	};
};

for(var i = 0; i < Bit.DECISIONS.length; i++){
	Bit.prototype['decide' + can.capitalize(Bit.DECISIONS[i])] = makeBitAction(Bit.DECISIONS[i]);
	Bit.prototype['is' + can.capitalize(Bit.DECISIONS[i])] = makeBitIsDecision(Bit.DECISIONS[i]);
}


export default Bit;
