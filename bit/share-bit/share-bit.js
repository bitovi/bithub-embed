import can from "can/";
import initView from "./share-bit.stache!";
import "./share-bit.less!";

var URL_TEMPLATES = {
	googleplus : "https://plus.google.com/share?hl=en&url={url}",
	facebook : "http://www.facebook.com/sharer/sharer.php?u={url}&t={title}",
	twitter: "https://twitter.com/intent/tweet?text={title}&url={url}&via={via}",
	delicious: "http://www.delicious.com/save?v=5&noui&jump=close&url={url}&title={title}",
	stumbleupon: "http://www.stumbleupon.com/badge/?url={url}",
	linkedin: "https://www.linkedin.com/cws/share?url={url}&token=&isFramed=true",
	pinterest: "http://pinterest.com/pin/create/button/?url={url}&media={media}&description={title}"
};

var getShareUrl = function(network, opts){
	var url = can.sub(URL_TEMPLATES[network], opts);
	console.log(url);
	return url;
};

var popup = {
	googleplus: function(opt){
		var url = getShareUrl('googleplus', {
			url: encodeURIComponent(opt.url)
		});
		window.open(url, "googleplus", "toolbar=0,status=0,width=900,height=500");
	},
	facebook: function(opt){
		var url = getShareUrl('facebook', {
			url: encodeURIComponent(opt.url),
			title: opt.title
		});
		window.open(url, "facebook", "toolbar=0,status=0,width=900,height=500");
	},
	twitter: function(opt){
		var url = getShareUrl('twitter', {
			title: encodeURIComponent(opt.title),
			url: encodeURIComponent(opt.url),
			via: opt.via
		});
		window.open(url, "twitter", "toolbar=0,status=0,width=650,height=360");
	},
	delicious: function(opt){
		var url = getShareUrl('delicious', {
			url: encodeURIComponent(opt.url),
			title: opt.title
		});
		window.open(url, 'delicious', 'toolbar=no,width=550,height=550');
	},
	stumbleupon: function(opt){
		var url = getShareUrl('stumbleupon', {
			url : encodeURIComponent(opt.url)
		});
		window.open(url, 'stumbleupon', 'toolbar=no,width=550,height=550');
	},
	linkedin: function(opt){
		var url = getShareUrl('linkedin', {
			url: encodeURIComponent(opt.url)
		});
		window.open(url, 'linkedin', 'toolbar=no,width=550,height=550');
	},
	pinterest: function(opt){
		var url = getShareUrl('pinterest', {
			url : encodeURIComponent(opt.url),

			media : encodeURIComponent(opt.media),
			title : opt.title
		});
		window.open(url, 'pinterest', 'toolbar=no,width=700,height=300');
	}
};
can.Component.extend({
	template: initView,
	tag: 'bh-share-bit',
	scope : {
		networksClass : function(){
			return this.media ? 'networks-7' : 'networks-6';
		}
	},
	events: {
		"[data-network] click" : function(el, ev){
			var network = el.data('network');
			var div = document.createElement('div');
			var title;

			div.innerHTML = this.scope.cardTitle;

			title = div.innerText;

			if(network === 'pinterest' || network === 'delicious'){
				title = title.replace(/#/g, '');
			}

			this.element.trigger('interaction:share', [this.scope.attr('state.hubId'), this.scope.attr('bit.id'), network]);
			popup[network]({
				title: title,
				media: this.scope.media,
				url: this.scope.url,
				via : "bithubapp"
			});
		}
	}
});
