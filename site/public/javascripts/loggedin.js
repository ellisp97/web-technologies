var select = document.getElementById("select"),
arr = ["dfsghrtr","werwth","dfsgsh","ewrth"];

for (var i=0; i<arr.length; i++){
    var option = document.createElement("OPTION"),
        txt = document.createTextNode(arr[i]);
    option.appendChild(txt);
    select.insertBefore(option,select.lastChild);
}

function reloadScrollBars() {
    document.documentElement.style.overflow = 'auto';  // firefox, chrome
    document.body.scroll = "yes"; // ie only
}

function unloadScrollBars() {
    document.documentElement.style.overflow = 'hidden';  // firefox, chrome
    document.body.scroll = "no"; // ie only
}