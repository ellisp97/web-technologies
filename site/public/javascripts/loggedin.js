var select = document.getElementById("select"),
arr = ["dfsghrtr","werwth","dfsgsh","ewrth"];

for (var i=0; i<arr.length; i++){
    var option = document.createElement("OPTION"),
        txt = document.createTextNode(arr[i]);
    option.appendChild(txt);
    select.insertBefore(option,select.lastChild);
}

