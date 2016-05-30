"use strict";


// When the user clicks on the button, 
// toggle between hiding and showing the dropdown content
function myFunction2() {
    document.getElementById("myDropdown1").classList.toggle("show1");
}


// Close the dropdown if the user clicks outside of it
function myFunction3() {
    document.getElementById("myDropdown2").classList.toggle("show2");
}


// Close the dropdown if the user clicks outside of it
function myFunction4() {
    document.getElementById("myDropdown3").classList.toggle("show3");
}


//highlight the tab after clicked.
function activateTab(pageId) {
    $(document).on("click",'ul li',function(){
        $('ul li').removeClass('active');
        $(this).addClass('active'); 
    });
    var tabCtrl = document.getElementById('tabCtrl');
    var pageToActivate = document.getElementById(pageId);
    for (var i = 0; i < tabCtrl.childNodes.length; i++) {
        var node = tabCtrl.childNodes[i];
        if (node.nodeType == 1) { 
            node.style.display = (node == pageToActivate) ? 'block' : 'none';
        }
    }
}


// After click table content, the system goes to map view, tab color changes.
function changecolor(){
    $('ul li').removeClass('active');

}
