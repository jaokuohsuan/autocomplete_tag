'use strict';

mojao.module('autoComplete', ['ajax', function(ajax) {

    var autoComplete = {};

    var defaultOptions = {
        template: './scripts/lib/autocomplete.html'
    };
    var bookshelf = {};
    var currentID, lastID;



    //filter data
    function filterSuggest(key,dataset,exclude) {

            //from start //use[^] to nagated
            //cover Array to String to exclude tags and recover to Araay

            var currentDataString = dataset.join(' ');
            var tagsExcludeRegExp = new RegExp('(^|\\b)' + exclude.join('\\s*|') + '(\\b|$)', 'gi');
            var result = currentDataString.replace(tagsExcludeRegExp, '');

            var currentData = result.split(' ');

            //Escape string for regex
            key = key.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');

            var regex = new RegExp('^' + key, 'i');
            var filtered = [];

            for (var i = 0, k = currentData.length; i < k; i++) {

                if (regex.test(currentData[i])) {
                    filtered.push(currentData[i]);
                }
            }
            //sort
            filtered.sort();

            return filtered;
        }
        //extend defaultvalue
    function extend(defaultValue, optionValue) {

        optionValue = optionValue || {};

        for (var i in defaultValue) {
            if (defaultValue.hasOwnProperty(i)) {
                optionValue[i] = defaultValue[i];
            }
        }

        return optionValue;

    }

    function onInputKeyDown(evt) {
        var keyCode = evt.keyCode;
        var target = evt.currentTarget;
        var thisElem = this;

        switch (keyCode) {
            case 8: //backspace
                if (target.value === '') {

                    //remove tag
                    removeTag.bind(thisElem)();
                    evt.preventDefault();
                }
                break;


            case 13: //enter
                var keyArray = filterSuggest(target.value,thisElem.dataset,thisElem.tags);
                if (keyArray.length !== 0 && target.value.toUpperCase() === keyArray[0].toUpperCase()) {

                    addTag.bind(thisElem)(filterSuggest(target.value,thisElem.dataset,thisElem.tags)[0]);
                }
                evt.preventDefault();
                break;

            case 9: //tab use the same action as down
            case 40: //down arrow                
                if (target.value !== '') {
                    target.blur();
                    var focusItem = thisElem.suggestList.getElementsByClassName('autocomplete__suggest__listitem')[0];
                    focusItem.focus();
                    thisElem.pseudoInput.innerHTML = focusItem.innerHTML;
                    showPseudoInput();

                    // hideSuggest();
                }
                evt.preventDefault();
                break;
        }
    }

    function onSuggestKeyDown(evt) {
        var keyCode = evt.keyCode;
        var target = evt.target;
        var thisElem = this;

        switch (keyCode) {
            case 8: //backspace

                var tempValue = thisElem.inputDom.value;

                thisElem.inputDom.value = tempValue.slice(0, -1);

                //if empty hide suggest
                if (tempValue.slice(0, -1) === '') {
                    hideSuggest();
                }
                hidePseudoInput();
                thisElem.inputDom.focus();
                evt.preventDefault();

                break;


            case 13: //enter

                var value = target.innerHTML;
                addTag.bind(thisElem)(value);
                evt.preventDefault();

                break;
            case 38: //up arrow

                if (target.previousElementSibling) {
                    target.previousElementSibling.focus();
                    thisElem.pseudoInput.innerHTML = target.previousElementSibling.innerHTML;
                } else {
                    //refocus on input
                    target.blur();

                    thisElem.inputDom.focus();

                    if (thisElem.inputDom.value === '') {
                        hideSuggest();
                    } else {
                        hidePseudoInput();
                    }

                }
                evt.preventDefault();
                break;

            case 9: //tab use the same action as down

            case 40: //down arrow

                if (target.nextElementSibling) {
                    target.nextElementSibling.focus();
                    thisElem.pseudoInput.innerHTML = target.nextElementSibling.innerHTML;
                }
                evt.preventDefault();

                break;
        }
    }

    function addTag(value) {
        //if empty value
        if (value === '') {
            return;
        }
        var thisElem = this;

        var inputItem = thisElem.inputItem;
        var input = thisElem.inputDom;
        var insertParent = thisElem.tagWarp;
        //create fragment
        var fragment = document.createDocumentFragment();
        var anchor = document.createElement('li');
        anchor.className = 'autocomplete__tagitem';
        var remove = document.createElement('span');
        remove.className = 'autocomplete__tagitem__remove';
        anchor.innerHTML = '<span>' + value + '</sapn>';
        anchor.appendChild(remove);
        fragment.appendChild(anchor);

        // add remove listener
        remove.addEventListener('click', function(evt) {
            removeTag.bind(thisElem)(evt.currentTarget.parentNode);
        }.bind(thisElem));


        insertParent.insertBefore(fragment, inputItem);
        thisElem.tags.push(value);

        input.value = '';
        input.focus();
        hideSuggest();



    }

    function removeTag(target) {
        var thisElem = this;

        var thisWarp = thisElem.tagWarp;
        var tagsArray = thisWarp.getElementsByClassName('autocomplete__tagitem');
        var tagsLength = tagsArray.length;

        //depend on backspace or click remove button
        if (tagsLength !== 0 && typeof(target) === 'undefined') {
            thisWarp.removeChild(tagsArray[tagsLength - 1]);
            thisElem.tags.splice(-1);

        } else if (target) {

            thisWarp.removeChild(target);
            // remove tag data
            var value = target.getElementsByTagName('span')[0].innerHTML;
            var tagOrder = thisElem.tags.indexOf(value);
            thisElem.tags.splice(tagOrder, 1);

        }



    }

    function hideSuggest(id) {
        var id = id || currentID;

        bookshelf[id].suggestDiv.classList.add('is-hide');
        hidePseudoInput();
    }

    function showSuggest(id) {
        var id = id || currentID;

        bookshelf[id].suggestDiv.classList.remove('is-hide');
        showPseudoInput();

    }

    function hidePseudoInput(id) {
        var id = id || currentID;
        bookshelf[id].pseudoInput.classList.add('is-hide');
        bookshelf[id].pseudoInput.innerHTML = null;
    }

    function showPseudoInput(id) {
        var id = id || currentID;
        bookshelf[id].pseudoInput.classList.remove('is-hide');
    }



    function updateSuggestList(keyArray) {

        var thisElem = this;

        var suggestData = keyArray;
        var fragment = document.createDocumentFragment();
        var anchor;



        for (var i = 0, k = suggestData.length; i < k; i += 1) {

            anchor = document.createElement('li');
            anchor.className = 'autocomplete__suggest__listitem';
            anchor.setAttribute('tabindex', 0);

            anchor.innerHTML = suggestData[i];
            fragment.appendChild(anchor);
        }

        var node = thisElem.suggestList;
        node.innerHTML = null;
        node.appendChild(fragment);

    }

    function initEventListener() {

        var thisElem = this;
        var targetInput = thisElem.inputDom;


        targetInput.addEventListener('input', function(evt) {

            var key = evt.currentTarget.value;
            var thisElem=this;
            var keyArray = filterSuggest(key,thisElem.dataset,thisElem.tags);

            if (keyArray.length !== 0) {
                if (key !== '') {

                    updateSuggestList.bind(thisElem)(keyArray);
                    showSuggest(thisElem.id);

                } else {

                    //hide suggest
                    hideSuggest(thisElem.id);
                }

            } else {
                //if no fit item

                key = key.slice(0, -1);
                evt.currentTarget.value = key;

            }


        }.bind(thisElem));


        targetInput.addEventListener('focus', function(evt) {



            if (this.id !== currentID && typeof(currentID) !== 'undefined') {
                lastID = currentID;
                hideSuggest(lastID);
                hidePseudoInput(lastID);
            }

            var key = evt.currentTarget.value;
            if (key !== '') {
                currentID = this.id;
                showSuggest();

            }



        }.bind(thisElem));


        targetInput.addEventListener('keydown', onInputKeyDown.bind(thisElem));
        thisElem.suggestList.addEventListener('keydown', onSuggestKeyDown.bind(thisElem));

        thisElem.suggestList.addEventListener('click', function(evt) {
            currentID = this.id;
            addTag.bind(this)(evt.target.innerHTML);

        }.bind(thisElem));


    }



    //each autocomplete
    var Elem = function(options) {



        this.id = options.id;
        this.tags = [];
        this.dataset = null;
        this.dom = null;
        this.tagWarp = null;
        this.tagDom = null;

        this.inputDom = null;
        this.inputItem = null;
        this.pseudoInput = null;

        this.suggestDiv = null;
        this.suggestList = null;
        this.suggestListItem = null;

        //load data
        ajax(options.data).then(function(data) {
            this.dataset = JSON.parse(data);
        }.bind(this));


        // load template and remember
        ajax(options.template).then(function(data) {



            var tempDom = document.getElementById(this.id);
            tempDom.innerHTML = data;


            //remember dom 
            this.dom = tempDom;
            this.suggestDiv = this.dom.querySelector('.autocomplete__suggest');
            this.inputDom = this.dom.querySelector('.autocomplete__input');
            this.suggestList = this.dom.querySelector('.autocomplete__suggest__list');
            this.inputItem = this.dom.querySelector('.autocomplete__inputitem');
            this.tagWarp = this.dom.querySelector('.autocomplete__taglist');
            this.pseudoInput = this.dom.querySelector('.autocomplete__pseudo-input');
            // bookshelf[id].suggestListItem=this.dom.querySelector('.autocomplete__suggest__listitem');


            this.dom.addEventListener('click', function(evt) {
                this.inputDom.focus();
                currentID = this.id;

            }.bind(this));

            initEventListener.bind(this)();

        }.bind(this));



    };



    autoComplete.init = function(options) {


        extend(defaultOptions, options);

        bookshelf[options.id] = new Elem(options);


    };



    return autoComplete;

}]);