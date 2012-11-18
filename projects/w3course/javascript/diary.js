
Modernizr.load([
  {
    test: 'classList' in document.createElement('p'),
    nope: 'javascript/classList.min.js'
  },
  {
    test: Modernizr.geolocation,
    nope: 'javascript/geolocation.min.js'
  },
  {
    test: window.JSON,
    nope: 'javascript/json2.min.js'
  },
  {
    test: Modernizr.localstorage,
    nope: 'javascript/storage.min.js'
  }
]);


var clickevent = "mousedown";
if(Modernizr.touch) {
    // touch events are supported
    clickevent = "touchstart";
}

var Entries = {
    index: localStorage.getItem("Entries:index"),
    $entries: document.getElementsByClassName("entries")[0],
    $form: document.getElementById("entries-form"),
    $btn_save: document.getElementById("btn-save"),
    $btn_cancel: document.getElementById("btn-cancel"),
    $btn_add: document.getElementById("btn-add"),
    $geo: document.getElementById("geo-position"),

    init: function() {
        // initialize storage
        if(!Entries.index) {
            localStorage.setItem("Entries:index", Entries.index = 1);
        }

        // initialize form
        Entries.$form.reset();

        var input_list = [Entries.$form.subject, Entries.$form.description];
        input_list.forEach(function(el) {
            el.addEventListener("input", function() {
                if (Entries.$form.subject.value === "" || Entries.$form.description.value === "") {
                    Entries.$btn_save.disabled = true;
                } else {
                    Entries.$btn_save.disabled = false;
                }
            }, false);
        });

        Entries.$btn_cancel.addEventListener(clickevent, function() {
            Entries.$form.reset();
            Entries.$form.id_entry.value = 0;

            document.getElementById("wrapper-add-entry").classList.toggle("hide");
            Entries.$btn_add.classList.toggle("hide");
            Entries.$entries.classList.toggle("hide");
        }, true);
        
        Entries.$form.addEventListener("submit", function(evt) {
            var entry = {
                id: parseInt(this.id_entry.value, 10),
                subject: this.subject.value,
                description: this.description.value,
                lat: this.lat.value,
                lon: this.lon.value,
                timestamp: new Date()
            };
            if(entry.id === 0) {
                Entries.storeAdd(entry);
                Entries.viewAdd(entry);
            } else {
                Entries.storeEdit(entry);
                Entries.viewEdit(entry);
            }

            this.reset();
            this.id_entry.value = 0;
            evt.preventDefault();
            Entries.$btn_add.classList.toggle("hide");
            document.getElementById("wrapper-add-entry").classList.toggle("hide");
            Entries.$entries.classList.toggle("hide");
        }, true);
               
        // initialize page
        if (localStorage.length - 1) {
            var entries_list = [], i, key;
            for (i = 0; i < localStorage.length; i++) {
                key = localStorage.key(i);
                // only process 'Entries:1', 'Entries:2' etc keys, ignore 'Entries:index' 
                if (/Entries:\d+/.test(key)) {                             
                    entries_list.push(JSON.parse(localStorage.getItem(key)));
                }
            }

            if (entries_list.length) {
                // last entry displayed on top
                entries_list.sort(function(a, b) {
                    return parseInt(a.id, 10) - parseInt(b.id, 10);
                }).forEach(Entries.viewAdd);                       
            }
        }

       
        Entries.$entries.addEventListener(clickevent, function(evt) {
            var op = evt.target.getAttribute("data-op");
            if (/edit|remove/.test(op)) {
                var entry = JSON.parse(localStorage.getItem("Entries:" + evt.target.getAttribute("data-id")));
                if (op === "edit") {
                    // switching styles
                    document.getElementById("wrapper-add-entry").classList.toggle("hide");
                    Entries.$btn_add.classList.toggle("hide");
                    Entries.$entries.classList.toggle("hide");
                    Entries.$form.subject.value = entry.subject;
                    Entries.$form.description.value = entry.description;
                    // position changed, update
                    Entries.$form.id_entry.value = entry.id;
                } else if (op === "remove") {
                    if (confirm("Sure to remove entry " + entry.subject + " from diary?")) {
                        Entries.storeRemove(entry);
                        Entries.viewRemove(entry);
                    }
                }
                event.preventDefault();
            }
        }, true);

        Entries.$btn_add.addEventListener(clickevent, function() {
            Entries.$form.reset();
            document.getElementById("wrapper-add-entry").classList.toggle("hide");
            Entries.$btn_add.classList.toggle("hide");
            Entries.$entries.classList.toggle("hide");
            var timeoutVal = 10*1000*1000;
            navigator.geolocation.getCurrentPosition(function(pos) {
                Entries.$form.lat.value = pos.coords.latitude;
                Entries.$form.lon.value = pos.coords.longitude;
                Entries.$geo.innerHTML = "Current postion " + pos.coords.latitude + ", " + pos.coords.longitude;
            }, function() {
                // geolocation failed
                Entries.$geo.innerHTML = "No geolocation data available.";
            }, { enableHighAccuracy: true, timeout: timeoutVal, maximumAge: 0});
        }); 

    },

    storeAdd: function(entry) {
        entry.id = Entries.index;
        localStorage.setItem("Entries:index", ++Entries.index);
        localStorage.setItem("Entries:" + entry.id, JSON.stringify(entry));
    },

    storeEdit: function(entry) {
        localStorage.setItem("Entries:" + entry.id, JSON.stringify(entry));
    },

    storeRemove: function(entry) {
        localStorage.removeItem("Entries:" + entry.id);
    },

    viewAdd: function(entry) {
        var article, h2, p;
        article = document.createElement("article");
        h2 = document.createElement("h2");
        h2.appendChild(document.createTextNode(entry.subject));
        // add show/hide logic ass 2
        h2.addEventListener(clickevent, function() {
            this.classList.toggle("normal"); // h2 element
            this.nextElementSibling.classList.toggle("active"); // p element
        });
        p = document.createElement("p");
        p.appendChild(document.createTextNode(entry.description));
        // edit + remove controls
        var controls = document.createElement("div");
        controls.innerHTML = '<br/><div class="controls"><a data-id="' + entry.id + '" data-op="edit">Edit</a> | <a data-id="' + entry.id + '" data-op="remove">Remove</a></div><div class="details"></div>'; 
        while (controls.firstChild) { p.appendChild(controls.firstChild); }

        article.appendChild(h2);
        article.appendChild(p);
        article.setAttribute("data-timestamp", entry.timestamp);
        article.setAttribute("data-lat", entry.lat);
        article.setAttribute("data-lon", entry.lon);
        article.setAttribute("id", "entry-" + entry.id);
        Entries.$entries.insertBefore(article, Entries.$entries.childNodes[0]);
        Entries.prettyDates();    
    },

    viewEdit: function(entry) {
        var article = document.getElementById("entry-" + entry.id), h2, p; 
        article.innerHTML = "";
        h2 = document.createElement("h2");
        h2.appendChild(document.createTextNode(entry.subject));
        // assignment 2 logic
        h2.addEventListener(clickevent, function() {
            this.classList.toggle("normal");
            this.nextElementSibling.classList.toggle("active");
        });
        p = document.createElement("p");
        p.appendChild(document.createTextNode(entry.description));
        var controls = document.createElement("div");
        controls.innerHTML = '<br/><div class="controls"><a data-id="' + entry.id + '" data-op="edit">Edit</a> | <a data-id="' + entry.id + '" data-op="remove">Remove</a></div><div class="details"></div>';
        while (controls.firstChild) { p.appendChild(controls.firstChild); }
                    
        article.appendChild(h2);
        article.appendChild(p);
        article.setAttribute("data-timestamp", entry.timestamp);
        article.setAttribute("data-lat", entry.lat);
        article.setAttribute("data-lon", entry.lon);
        Entries.prettyDates();
    },

    viewRemove:  function(entry) {
        Entries.$entries.removeChild(document.getElementById("entry-" + entry.id));
        Entries.prettyDates();
    },

    // prettify dates using moment.js
    prettyDates: function() {
        // find all articles and timestamps
        [].forEach.call(document.querySelectorAll("article"), function(el) {
            var coords, fromNow, timestamp = Date.parse(el.getAttribute("data-timestamp"));
            fromNow = moment(timestamp).fromNow();
            // add nice maps link here
            coords = el.getAttribute("data-lat").concat(",").concat(el.getAttribute("data-lon"));
            if( /(\-?\d+(\.\d+)?),(\-?\d+(\.\d+)?)/.test(coords) ) {
                el.querySelector("div.details").innerHTML = fromNow.concat('<a class="location" href="http://maps.google.com?q=loc:' + coords + '">Show on map</a>');
            } else {
                el.querySelector("div.details").innerHTML = fromNow;
            }
        });
    }
                 
};
Entries.init();

