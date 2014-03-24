
/**
* @version 1.0.2
* @package PWebBox
* @copyright © 2013 Majestic Media sp. z o.o., All rights reserved. http://www.perfect-web.co
* @license GNU General Public Licence http://www.gnu.org/licenses/gpl-3.0.html
* @author Piotr Moćko
*
* Mootools 1.12, 1.2.5
*/
if(typeof SqueezeBox!="undefined"&&(typeof SqueezeBox.pwebVersion=="undefined"||SqueezeBox.pwebVersion<1)){if(typeof $unlink!="function"){function $unlink(c){var b;switch($type(c)){case"object":b={};for(var e in c){b[e]=$unlink(c[e])}break;case"hash":b=new Hash(c);break;case"array":b=[];for(var d=0,a=c.length;d<a;d++){b[d]=$unlink(c[d])}break;default:return c}return b}}SqueezeBox.parentClose=SqueezeBox.close;$extend(SqueezeBox,{pwebVersion:1,startPosition:{x:0,y:0},resize:function(b,a){var c=window.getSize();this.size=$merge(this.isLoading?this.options.sizeLoading:this.options.size,b);var d={width:this.size.x,height:this.size.y,left:((c.size.x-this.size.x-this.options.marginInner.x)/2).toInt(),top:((c.size.y-this.size.y-this.options.marginInner.y)/2).toInt()};if(a){this.window.setStyles({width:0,height:0,left:this.startPosition.x||c.size.x/2,top:this.startPosition.y||(this.options.resizeFromTop?0:c.size.y/2)})}this.hideContent();this.fx.window.start(d).chain(this.showContent.bind(this));this.window.setStyle("display","");this.reposition(c)},close:function(b){var a=this.parentClose(b);this.startPosition={x:0,y:0};this.removeEvents("onOpen");this.removeEvents("onClose");this.removeEvents("onUpdate");this.removeEvents("onResize");this.removeEvents("onMove");this.removeEvents("onShow");this.removeEvents("onHide");$merge(this.presets,this.presetsInit);return a}});SqueezeBox.presetsInit=$unlink(SqueezeBox.presets);SqueezeBox.presetsInit.fxResizeDuration=500;SqueezeBox.presetsInit.resizeFromTop=false};