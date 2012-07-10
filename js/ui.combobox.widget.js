/*
 * jQuery UI Autocomplete Combobox Widget with Categories
 * 
 * Creates an autocomplete combobox with categories from a select with optgroups.
 * 
 * A totally re-worked hybrid of two demo widgets from the autocomplete page:
 * http://jqueryui.com/demos/autocomplete/
 * 
 * The first demo is "Combobox" and the second is "Categories"
 *
 * The source was referenced on 4/8/2012 and was under the MIT and GPL licenses:
 * http://jquery.org/license
 * 
 * CSS styling is recommended for the category headers, and additional styling
 * will probably be needed to get everything to line up how you would like.
 * Example from the jQuery UI demo page for category header styling:
 * .ui-autocomplete-category {
 *		font-weight: bold;
 *		padding: .2em .4em;
 *		margin: .8em 0 .2em;
 *		line-height: 1.5;
 *	}
 *
 * @author: John Kupko
 * @company: Pamiris Inc.
 * This software is licensed under the GPL v3 and the MIT licenses:
    http://github.com/jquery/jquery/blob/master/MIT-LICENSE.txt
    http://github.com/jquery/jquery/blob/master/GPL-LICENSE.txt
 
Copyright 2012 Pamiris Inc. All rights reserved
    
THIS SOFTWARE IS PROVIDED BY THE FREEBSD PROJECT ``AS IS'' AND ANY EXPRESS OR 
IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF 
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT 
SHALL THE FREEBSD PROJECT OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, 
INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT 
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR 
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF 
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE 
OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF 
ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

The views and conclusions contained in the software and documentation are those 
of the authors and should not be interpreted as representing official policies, 
either expressed or implied, of Pamiris Inc.

 */

//helper widget to safely override the render functions
$.widget( "custom.catcomplete", $.ui.autocomplete, {
		_renderItem: function(ul, item) {
            return $( "<li></li>" )
                .data( "item.autocomplete", item )
                .append( "<a>" + item.label + "</a>" )
                .appendTo( ul ); 
        },
        _renderMenu: function( ul, items ) {
            var that = this;
			var currentCategory = "";
            $.each( items, function( index, item ) {
                if ($(item.option).parent("optgroup").length > 0) {
                    $(item).attr("category", $(item.option)
                        .parent("optgroup")
                        .attr("label"));
                } else {
                    $(item).attr("category", "");
                }
                if ( item.category != currentCategory ) {
                    ul.append( "<li class='ui-autocomplete-category'>"
                        + item.category
                        + "</li>" );
                    currentCategory = item.category;
                }
                that._renderItem( ul, item );
            });
        }    
	});

(function( $ ) {
    $.widget( "ui.combobox", {
    
        input : null,
        options: {
            defaultMessage: null,
            change: null
        },

        _create: function() {
            var that = this,
            select = this.element.hide(),
            selected = $( ":selected", select ),
            value = selected.val() ? selected.text() : "";
            if (this.options.defaultMessage) {value = this.options.defaultMessage;}
            var input = this.input = $( "<input>" );
            input.insertAfter( select ).val( value );
            
            input.catcomplete({
                    delay: 0,
                    minLength: 0,
                    source: function( request, response ) {
                        var matcher = new RegExp( 
                            $.ui.autocomplete.escapeRegex(request.term), "i"
                        );
                        response( $("option", select ).map(function() {
                            var text = $( this ).text();
                            if ('undefined' != typeof this.value 
                                && ( !request.term || matcher.test(text) ) ) {
                                return {
                                    label: text.replace(
                                        new RegExp(
                                            "(?![^&;]+;)(?!<[^<>]*)(" +
                                            $.ui.autocomplete.escapeRegex(request.term) +
                                            ")(?![^<>]*>)(?![^&;]+;)", "gi"
                                        ), "<strong>$1</strong>" ),
                                    value: text,
                                    option: this
                            };
                            }
                        }) );
                    },
                    select: function( event, ui ) {
                        ui.item.option.selected = true;
                        that._trigger( "selected", event, {
                            item: ui.item.option
                        });
                        that._trigger("change");
                        $(input).trigger("blur");
                    },
                    change: function( event, ui ) {
                        if ( !ui.item ) {
                            var matcher = new RegExp( 
                                "^" + $.ui.autocomplete.escapeRegex( 
                                    $(this).val() ) + "$", "i" 
                            ),
                            valid = false;
                            $("option", select).each(function() {
                                if ( $( this ).text().match( matcher ) ) {
                                    this.selected = valid = true;
                                    //still don't know if it is an actual change...
                                    that._trigger("change");
                                    return false;
                                }
                            });
                            if ( !valid ) {
                                // remove invalid value, as it didn't match anything
                                $( this ).val( "" );
                                select.val( "" );
                                input.data( "catcomplete" ).term = "";
                                if (that.options.defaultMessage) {
                                    $(input).val( that.options.defaultMessage );
                                }
                                return false;
                            }
                        }                      
                    }
                });
            input.addClass( "ui-widget ui-widget-content" );            

            input.click(function() {
                if (that.options.defaultMessage 
                    && $(this).val() == that.options.defaultMessage) {
                    $(this).val( "" );
                }
            });

            this.button = $( "<button type='button'>&nbsp;</button>" )
                .attr( "tabIndex", -1 )
                .attr( "title", "Show All Items" )
                .insertAfter( input )
                .button({
                    icons: {
                        primary: "ui-icon-triangle-1-s"
                    },
                    text: false
                })
                .removeClass( "ui-corner-all" )
                .addClass( "ui-button-icon" )
                .click(function() {
                    // close if already visible
                    if ( input.catcomplete( "widget" ).is( ":visible" ) ) {
                        input.catcomplete( "close" );
                        return;
                    }

                    // work around a bug (likely same cause as #5265)
                    $( this ).blur();

                    // pass empty string as value to search for, displaying all results
                    input.catcomplete( "search", "" );
                    input.focus();
                });
        },

        destroy: function() {
            this.input.remove();
            this.button.remove();
            this.element.show();
            $.Widget.prototype.destroy.call( this );
        }
    });
})( jQuery );
