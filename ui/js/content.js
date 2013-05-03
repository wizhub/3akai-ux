/*!
 * Copyright 2012 Sakai Foundation (SF) Licensed under the
 * Educational Community License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may
 * obtain a copy of the License at
 *
 *     http://www.osedu.org/licenses/ECL-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS"
 * BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

// TODO: Remove this once we have a better way of sharing data
var sakai_global = sakai_global || {};

require(['jquery','oae.core'], function($, oae) {

    //  Get the content id from the URL. The expected URL is `/content/<contentId>`
    var contentId = $.url().segment(2);
    if (!contentId) {
        oae.api.util.redirect().login();
    }

    // Variable used to cache the requested content profile
    var contentProfile = null;

    /**
     * Shows or hides actions on the content profile (e.g. uploading a new version)
     */
    var showContentActions = function() {
        // When we are dealing with a file, new versions can be uploaded and the revision history can be shown
        if (contentProfile.resourceSubType === 'file') {
            $('li .oae-trigger-uploadnewversion').show();
        }
    };

    /**
     * Shows the content profile preview.
     * If the user has no access to the profile or the content has not been found they are redirected.
     *
     * @param  {Object}   err       An error object, if any.
     * @param  {Object}   profile   The content profile object
     */
    var showContentProfilePreview = function(err, profile) {
        if (err) {
            if (err.code === 401) {
                oae.api.util.redirect().accessdenied();
            } else {
                oae.api.util.redirect().notfound();
            }
            return;
        }

        contentProfile = profile;

        // Refresh the preview
        $('#content_preview_container').html('');
        // Insert the preview
        oae.api.widget.insertWidget('contentpreview', null, $('#content_preview_container'), null, contentProfile);
    };

    /**
     * Get the content's basic profile and set up the screen. If the content
     * can't be found or is private to the current user, the appropriate
     * error page will be shown
     */
    var getContentProfile = function() {
        oae.api.content.getContent(contentId, function(err, profile) {
            showContentProfilePreview(err, profile);
            $(window).trigger('ready.content.oae');
            // Render the entity information
            setUpClip();
            // Set the browser title
            oae.api.util.setBrowserTitle(contentProfile.displayName);
            // We can now unhide the page
            oae.api.util.showPage();
            // Shows or hides actions on the content profile (e.g. uploading a new version)
            showContentActions();
            // Fire off an event to widgets that passes the content profile data
            $(document).trigger('oae.context.send', contentProfile);
        });
    };

    /**
     * Refresh the content's basic profile and update widgets that need the updated information.
     */
    var refreshContentProfile = function() {
        oae.api.content.getContent(contentId, showContentProfilePreview);
    };

    // Bind to the context requests coming in from widgets and send back the content profile data
    $(document).on('oae.context.get', function() {
        $(document).trigger('oae.context.send', contentProfile);
    });

    // Catches the `upload new version complete` event and refreshes the content profile
    $(document).on('oae-uploadnewversion-complete', refreshContentProfile);

    /**
     * Render the content's clip, containing the thumbnail, display name as well as the
     * content's admin options
     */
    var setUpClip = function() {
        oae.api.util.template().render($('#content-clip-template'), {'content': contentProfile}, $('#content-clip-container'));
    };

    getContentProfile();

});
