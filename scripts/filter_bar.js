"use strict";

//set up the drop down tabs.
function setupDropdowns() {
    // Close the dropdown if the user clicks outside of it
    window.onclick = function(event) {
        if (!event.target.matches('.dropbtn3')) {

            const dropdowns = document.getElementsByClassName("dropdown-content3");
            for (let i = 0; i < dropdowns.length; i++) {
                const openDropdown = dropdowns[i];
                if (openDropdown.classList.contains('show3')) {
                    openDropdown.classList.remove('show3');
                }
            }
        }

        if(!event.target.matches('.dropbtn2')){
            const dropdowns = document.getElementsByClassName("dropdown-content2");
            for (let i = 0; i < dropdowns.length; i++) {
                const openDropdown = dropdowns[i];
                if (openDropdown.classList.contains('show2')) {
                    openDropdown.classList.remove('show2');
                }
            }
        }

        if(!event.target.matches('.dropbtn1')){
            const dropdowns = document.getElementsByClassName("dropdown-content1");
            for (let i = 0; i < dropdowns.length; i++) {
                const openDropdown = dropdowns[i];
                if (openDropdown.classList.contains('show1')) {
                    openDropdown.classList.remove('show1');
                }
            }
        }
    }

    $(".dropdown2 dt a").on('click', function() {
        $(".dropdown2 dd ul").slideToggle('fast');
    });
    $(".dropdown2 dd ul li a").on('click', function() {
        $(".dropdown2 dd ul").hide();
    });
    function getSelectedValue(id) {
        return $("#" + id).find("dt a span.value").html();
    }

    $(document).bind('click', function(e) {
        const clicked = $(e.target);
        if (!clicked.parents().hasClass("dropdown2")) $(".dropdown2 dd ul").hide();
    });

    $('.mutliSelect2 input[type="checkbox"]').on('click', function() {
        const title = $(this).val() + ",";

        if (!$(this).is(':checked')) {
            $('span[title="' + title + '"]').remove();
        }
    });

    $(".dropdown1 dt a").on('click', function() {
        $(".dropdown1 dd ul").slideToggle('fast');
    });

    $(".dropdown1 dd ul li a").on('click', function() {
        $(".dropdown1 dd ul").hide();
    });

    function getSelectedValue(id) {
        return $("#" + id).find("dt a span.value").html();
    }

    $(document).bind('click', function(e) {
        const clicked = $(e.target);
        if (!clicked.parents().hasClass("dropdown1")) $(".dropdown1 dd ul").hide();
    });

    $('.mutliSelect1 input[type="checkbox"]').on('click', function() {
        const title = $(this).val() + ",";

        if (!$(this).is(':checked')) {
            $('span[title="' + title + '"]').remove();
        }
    });
}
// let the start date and end date of the slider to be two global variables. 
let endDate = new Date();
let startDate = new Date();
startDate.setMonth(startDate.getMonth() - 3);

// set up the slider.
function setupSlider() {
    const dateMax = new Date();
    const dateMin = new Date(2011, 1, 1);
    const baseURL = 'https://data.fortworthtexas.gov/resource/i85s-46fv';

    $("#slider").dateRangeSlider({
        bounds: {
            min: dateMin,
        max: dateMax
        },
        defaultValues: {
            min: startDate,
        max: dateMax
        }
    });

    $('#slider').bind('userValuesChanged', function(event, data) {
        let inputMax = $("#slider").dateRangeSlider("max");
        let inputMin = $("#slider").dateRangeSlider("min");
        inputMax = moment(inputMax).add(1, 'days').format("YYYY-MM-DD");
        inputMin = moment(inputMin).subtract(1, 'days').format("YYYY-MM-DD");
        let dateArrays = inputMin.split("-");
        let dateArraye = inputMax.split("-");
        startDate = new Date(dateArrays[0],dateArrays[1]-1,dateArrays[2]);
        endDate = new Date(dateArraye[0],dateArraye[1]-1,dateArraye[2]);

        g_filter.draw(FilterBar._buildQuery());
    });
}


// container IDs for the checkbox groups
const _containers = [
['crimetype-div', 'crimeType'],
    ['weapon-div', 'weapon'],
    ['mutliSelect1', 'district'],
    ['mutliSelect2', 'neighborhood']
    ];


    class FilterBar {
        static _onAllCheckboxClicked(container, event) {
            // `this` is the checkbox

            $(container).find('input:checkbox').prop('checked', this.checked);
            g_filter.draw(FilterBar._buildQuery());
        }


        static _onCheckboxClicked(container, event) {
            // `this` is the checkbox

            if (!this.checked) {
                $(container).find('input:checkbox').first().prop('checked', false);
            } else if ($(container).find('input:checkbox:checked').length === $(container).find(':checkbox').length - 1) {
                $(container).find('input:checkbox').first().prop('checked', true);
            }

            g_filter.draw(FilterBar._buildQuery());
        }


        static _getSelectedPropertyValues(container) {
            const result = [];

            const checkboxes = $(container).find('input:checkbox:checked').each(function () {
                let labelText = $(this).next('label').text();

                if (labelText !== 'All') {
                    result.push(labelText);
                }
            });

            return result;
        }


        // construct a query based on the selected filters
        static _buildQuery() {
            const result = {};

            for (const entry of _containers) {
                const container = document.getElementById(entry[0]);

                result[container.property] = FilterBar._getSelectedPropertyValues(container);
            }

            result.date = {"$gte": startDate, '$lte': endDate};
            return result;
        }


        static _createCheckbox(container, labelText, onClick) {
            const checkbox = document.createElement('input');
            const label = document.createElement('label');
            checkbox.type = 'checkbox';
            checkbox.checked = true;
            checkbox.onclick = onClick.bind(checkbox, container);
            label.innerHTML = labelText;
            container.appendChild(document.createElement('br'));
            container.appendChild(checkbox);
            container.appendChild(label);
        }


        static _createSelector(container, property, propertyValues) {
            container.property = property;

            FilterBar._createCheckbox(container, 'All', FilterBar._onAllCheckboxClicked);

            for (const entry of propertyValues) {
                FilterBar._createCheckbox(container, entry, FilterBar._onCheckboxClicked);
            }

            container.appendChild(document.createElement('br'));
            container.appendChild(document.createElement('br'));
        }


        // create a group of checkboxes for a filter selector
        static createSelector(containerId, property) {
            const container = document.getElementById(containerId);
            g_filter.getDistinct(property, FilterBar._createSelector.bind(this, container, property));
        }
    }


window.addEventListener('load', setupDropdowns);
window.addEventListener('load', setupSlider);

window.addEventListener('load', function () {
    for (const entry of _containers) {
        FilterBar.createSelector(entry[0], entry[1]);
    }
});

// decrease the zindex of the slider when the side bar is active. 
document.addEventListener('WebComponentsReady', function() {
    var el = document.querySelector("#paperDrawerPanel");
    el.drawerOpenIgnoreClose = false;
    el.drawerOpen = false;
    el.drawerEvent = 0;
    el.addEventListener('iron-select', function(el) {
        el.drawerEvent++;

        if (el.drawerEvent >= 4) {
            if (el.drawerOpenIgnoreClose) {
                el.drawerOpenIgnoreClose = false;
                document.getElementById("paperDrawerPanel").style.zIndex = 0;
            } else {
                el.drawerOpenIgnoreClose = true;
                document.getElementById("paperDrawerPanel").style.zIndex = 99;
            }
            el.drawerEvent = 0;
        }
    }.bind(this, el));
});
