/*!
 * @author:    Divio AG
 * @copyright: http://www.divio.ch
 */

//######################################################################################################################
// #NAMESPACES#
/**
 * @module Cl
 */
var Cl = window.Cl || {};

//######################################################################################################################
// #UTILS#
(function ($) {
    'use strict';

    /**
     * Contains various helpers
     *
     * @class Utils
     * @namespace Cl
     */
    Cl.Utils = {
        /**
         * Document setup for no javascript fallbacks and logging
         *
         * @method _document
         * @private
         */
        _document: function () {
            // remove no-js class if javascript is activated
            $(document.body).removeClass('noscript');
            // ensure that console methods don't throw errors
            this._consoleWrapper();
        },

        /**
         * Stubs all the methods from console api that are not available in current environment
         * DOCS: https://developer.chrome.com/devtools/docs/console-api
         *
         * @method _consoleWrapper
         * @private
         */
        _consoleWrapper: function () {
            var method;
            var noop = function () {};
            var methods = [
                'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
                'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
                'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
                'timeStamp', 'trace', 'warn'
            ];
            var length = methods.length;
            var console = (window.console = window.console || {});

            while (length--) {
                method = methods[length];

                // Only stub undefined methods.
                if (!console[method]) {
                    console[method] = noop;
                }
            }
        },

        /**
         * Simple redirection
         *
         * @method redirectTo
         * @public
         * @param url {String} URL string
         */
        redirectTo: function (url) {
            window.location.href = url;
        },

        /**
         * Save information within local storage
         *
         * @method setStorage
         * @public
         * @param token {String} namespace
         * @param value {String} storage value
         */
        setStorage: function (token, value) {
            if (window.localStorage) {
                localStorage.setItem(token, value);
            }
        },

        /**
         * Retrieve information from local storage
         *
         * @method getStorage
         * @public
         * @param token {String} namespace
         */
        getStorage: function (token) {
            if (window.localStorage) {
                return localStorage.getItem(token);
            }
        }

        // INFO: feel free to add more Utilities required for the project
    };

})(jQuery);
