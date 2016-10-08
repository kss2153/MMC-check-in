$(function() {

  Parse.$ = jQuery;

  // Initialize Parse with Parse application javascript keys
  Parse.initialize('id14562647328462821', 'key6473284673294381');
  Parse.serverURL = 'https://musical-mentors.herokuapp.com/parse';

  var CheckIn = Parse.Object.extend("CheckIn", {
    
    defaults: {
      mentorName: "No mentor name",
      studentName: "No student name",
      parentName: "No parent name",
      timeIn: new Date(),
      timeOut: new Date()
    },

    initialize: function() {
      if (!this.get("mentorName")) {
        this.set({"mentorName": this.defaults.content});
      }
      if (!this.get("studentName")) {
        this.set({"studentName": this.defaults.content});
      }
      if (!this.get("parentName")) {
        this.set({"parentName": this.defaults.content});
      }
    }

  });

  // This is the transient application state, not persisted on Parse
  var AppState = Parse.Object.extend("AppState", {
    defaults: {
      filter: "all"
    }
  });

  var CheckInList = Parse.Collection.extend({

    model: CheckIn,

    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    comparator: function(checkIn) {
      return checkIn.get('order');
    }

  });

  var ItemView = Parse.View.extend({
    tagName: "li",

    template: _.template($('#item-template').html()),

    initialize: function() {
      _.bindAll(this, 'render');
      //this.model.bind('change', this.render);
      //this.model.bind('destroy', this.remove);
    },

    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      //this.$('.edit').html(this.model.mentorName);
      this.input = this.$('.edit');
      //console.log(this.input);
      return this;
    }

  });

  var CheckInListView = Parse.View.extend({
    el: ".content",
   
    events: {
      "click #back-checkins": "backCheckIn"
    },
 
    initialize: function() {
      var self = this;
      _.bindAll(this, 'addOne', 'addAll', 'render');

      this.$el.html(_.template($("#manage-checkIns-template").html()));

      this.input = this.$("#new-checkin");
      this.checkins = new CheckInList;
      this.checkins.query = new Parse.Query(CheckIn);
      this.checkins.query.descending("timeIn"); 
      this.checkins.bind('reset', this.addAll);

      this.checkins.fetch();
    },

    backCheckIn: function() {
      new CheckInView();
    },

    render: function() {
      this.delegateEvents();
    },

    addOne: function(checkin) {
      var view = new ItemView({model: checkin});
      this.$("#todo-list").append(view.render().el);
    }, 

    addAll: function(collection, filter) {
      this.$("#todo-list").html("");
      this.checkins.each(this.addOne);  
    }

  });



  var SignUpView = Parse.View.extend({
    events: {
      "submit form.signup-form": "signUp",
      "click #back-login": "logIn"
    },

    el: ".content",
    
    initialize: function() {
      _.bindAll(this, "signUp");
      this.render();
    },

    signUp: function(e) {
      var self = this;
      var firstName = this.$("#signup-firstname").val();
      var lastName = this.$("#signup-lastname").val();
      var email = this.$("#signup-email").val();
      var username = this.$("#signup-username").val();
      var password = this.$("#signup-password").val();

      var user = new Parse.User();
      
      user.set("username", username);
      user.set("password", password);
      user.set("email", email);
      user.set("firstName", firstName);
      user.set("lastName", lastName);
      user.set("ACL", new Parse.ACL());    
      user.set("filledInfo", false);
    
      this.$("#log-in-spinner").show();
      user.signUp(null, {
        success: function(user) {
          new LessonInfoView();
          self.undelegateEvents();
          delete self;
        },

        error: function(user, error) {
          hideSpinner();
          self.$(".signup-form .error").html(_.escape(error.message)).show();
          self.$(".signup-form button").removeAttr("disabled");
        }
      });

      this.$(".signup-form button").attr("disabled", "disabled");

      return false;
    },

    logIn: function() {
      new LogInView();
    },

    render: function() {
      this.$el.html(_.template($("#signup-template").html()));
      this.delegateEvents();
    }
  });

  var LessonInfoView = Parse.View.extend({
    events: {
      "submit form.signup-form": "enterInfo",
      "click #skip-info": "skip"
    },

    el: ".content",
    
    initialize: function() {
      _.bindAll(this, "enterInfo");
      this.render();
    },

    enterInfo: function(e) {
      var self = this;
      var student = this.$("#student-fullname").val();
      var parent = this.$("#parent-fullname").val();
      var lessonLength = this.$("#lesson-length").val();

      var currentUser = Parse.User.current();
      if (currentUser) {
        currentUser.set("filledInfo", true);
        currentUser.set("studentName", student);
        currentUser.set("studentParentName", parent);
        currentUser.set("lessonLength", parseInt(lessonLength));
        currentUser.save(null, {
          success: function(user) {
            console.log("user saved");
            new CheckInView();
          },

          error: function(user, error) {
            self.$(".signup-form .error").html(_.escape(error.message)).show();
            self.$(".signup-form button").removeAttr("disabled");
          }
        });
      } else {
        new SignUpView();
      }
      
      this.$(".signup-form button").attr("disabled", "disabled");

      return false;
    },

    skip: function() {
      new CheckInView();
    },

    render: function() {
      this.$el.html(_.template($("#lessoninfo-template").html()));
      this.delegateEvents();
    }
  });

  var LogInView = Parse.View.extend({
    events: {
      "submit form.login-form": "logIn",
      "click #back-signup": "signUp"
    },

    el: ".content",
    
    initialize: function() {
      _.bindAll(this, "logIn");
      //spinner.style.display = "none";
      this.render();
    },

    logIn: function(e) {
      var self = this;
      var username = this.$("#login-username").val();
      var password = this.$("#login-password").val();
      
      //showSpinner();
      this.$("#log-in-spinner").show();
      //spinner.style.display = "inline";
      Parse.User.logIn(username, password, {
        success: function(user) {
          //spinner.style.display = "none";
          new CheckInView();
          self.undelegateEvents();
          delete self;
        },

        error: function(user, error) {
          hideSpinner();
          //self.render().$el.find("#log-in-spinner").hide();
          //this.$("#log-in-spinner").hide();
          //spinner.style.display = "none";
          self.$(".login-form .error").html("Invalid username or password. Please try again.").show();
          self.$(".login-form button").removeAttr("disabled");
        }
      });

      this.$(".login-form button").attr("disabled", "disabled");

      return false;
    },

    signUp: function() {
      new SignUpView();
    },

    render: function() {
      this.$el.html(_.template($("#login-template").html()));
      this.delegateEvents();
    }
  });

  function hideSpinner() {
    var spinner = document.getElementById("log-in-spinner");
    spinner.style.display = "none";  
  }

  function showSpinner() {
    var spinner = document.getElementById("log-in-spinner");
    spinner.style.visibility = "visible";
  }

  var PrevCheckInView = Parse.View.extend({
    events: {
      "submit form.signup-form": "createCheckIn",
      "click #back-check-in": "back"
    },

    el: ".content",
    
    initialize: function() {
      _.bindAll(this, "createCheckIn");
      this.render();
      setToToday();
    },

    createCheckIn: function(e) {
      var self = this;
      addPrev();      
      this.$(".signup-form button").attr("disabled", "disabled");

      return false;
    },

    back: function() {
      new CheckInView();
    },

    render: function() {
      this.$el.html(_.template($("#prev-checkin-template").html()));
      this.delegateEvents();
    }
  });

  function setToToday() {
    var now = new Date();
    var today = now.toISOString().substring(0, 10);
    console.log(today);
    document.getElementById("input-date").value = today;
  }

  function addPrev() {
    var currentUser = Parse.User.current();
    var dateInput = document.getElementById("input-date");
    var dateValue = dateInput.value;
    var timeIn = document.getElementById("input-time-in").value;
    var timeOut = document.getElementById("input-time-out").value;
    var date1 = new Date(dateValue + " " + timeIn);
    var date2 = new Date(dateValue + " " + timeOut);
    var dateString1 = date1.toLocaleString();
    var dateString2 = date2.toLocaleString();
    var newCheckIn = new Parse.Object("CheckIn");
    newCheckIn.set("mentorName", currentUser.get("firstName")
      + " " + currentUser.get("lastName"));
    newCheckIn.set("studentName", currentUser.get("studentName"));
    newCheckIn.set("parentName", currentUser.get("studentParentName"));
    newCheckIn.set("timeIn", date1);
    newCheckIn.set("stringTimeIn", dateString1);
    newCheckIn.set("timeOut", date2);
    newCheckIn.set("stringTimeIn", dateString2);
    newCheckIn.save(null, {
        success: function(newCheckIn) {
          document.getElementById("button").disabled = true;
          document.getElementById("check-in-saved").style.display = "inline"; 
          console.log("successfully added checkin");
          currentUser.set("currentCheckIn", newCheckIn.id);
          currentUser.save();
        },
        error: function(newCheckIn, error) {
          console.log(error.message);
        }
      });
  }
  
  var started = false;
  var CheckInView = Parse.View.extend({
    events: {
      "click #see-checkins": "viewCheckIns",
      "click #back-info": "backToInfo",
      "click #back-login": "logOut",
      "click #checkin-button": "checkIn",
      "click #prev-checkin": "prevCheckIn"
    },

    el: ".content",
    
    initialize: function() {
      _.bindAll(this, "checkIn");
      this.render();
      this.update();
    },

    checkIn: function(e) {
      if (started) {
        return;
      }
      started = true; 
      var self = this;
      var currentUser = Parse.User.current();
      var checked = currentUser.get("checkedIn");

      if(!checked && !googleLoc()) {
        this.$('#checkout-alert').html("Looks like you're not at PS 145. Submit a past check-in below.");
        return;
      }

      var date = new Date();
      currentUser.set("timeIn", date);
      currentUser.set("checkedIn", !checked);
      currentUser.save(null, {
        success: function(user) {
          if (checked) {
            this.$('#checkin-button').html("Check In");
            saveTimeOut();
          } else {
            console.log("create");
            var newCheckIn = new Parse.Object("CheckIn");
            newCheckIn.set("mentorName", currentUser.get("firstName") 
              + " " + currentUser.get("lastName"));
            newCheckIn.set("studentName", currentUser.get("studentName"));
            newCheckIn.set("parentName", currentUser.get("studentParentName"));
            newCheckIn.set("timeIn", currentUser.get("timeIn"));
            var timeInString = currentUser.get("timeIn").toLocaleString();;
            newCheckIn.set("stringTimeIn", timeInString);
            newCheckIn.save(null, {
              success: function(newCheckIn) {
                console.log("successfully added checkin");
                currentUser.set("currentCheckIn", newCheckIn.id);
                currentUser.save();
              },
              error: function(newCheckIn, error) {
                console.log(error.message);
              }
            });
            this.$('#checkin-button').html("Check Out");
          }
          console.log("user saved");
          started = false;
        },

        error: function(user, error) {
          self.$(".signup-form .error").html(_.escape(error.message)).show();
          self.$(".signup-form button").removeAttr("disabled");
        }
      });

    },

    prevCheckIn: function() {
      new PrevCheckInView();
    },

    viewCheckIns: function() {
      new CheckInListView();
    },

    logOut: function() {
      Parse.User.logOut();
      new LogInView();
    },

    backToInfo: function() {
      new LessonInfoView();
    },

    update: function() {
      var currentUser = Parse.User.current();
      currentUser.fetch().then(function(fetchedUser){
          var name = fetchedUser.get("firstName");
          this.$('#greeting').html("Hey, " + name + "!");
        }, function(error){
          //Handle the error
        });
      if (!currentUser.get("filledInfo")) {
        this.$('#back-info').html("Enter lesson info");
      } else {
        this.$('#back-info').html("Change lesson info");
      } 
      var dateNow = new Date();
      var dateThen = currentUser.get("timeIn");
      var lessonLength = currentUser.get("lessonLength");
      var checked = currentUser.get("checkedIn");
      console.log(dateNow - dateThen);
      if (checked && (dateNow - dateThen)/60000 > 2 * lessonLength) {
        this.$('#checkout-alert').html("We checked you out because your lesson ended.");
        currentUser.set("checkedIn", false);
        currentUser.save();
        saveTimeOut();
        return;
      }

      if (checked) {
        this.$('#checkin-button').html("Check Out");
      } else {
        this.$('#checkin-button').html("Check In");
      }
    },

    render: function() {
      this.$el.html(_.template($("#checkin-template").html()));
      this.delegateEvents();
    }
  });

  function saveTimeOut() {
    var currentUser = Parse.User.current();
    var query = new Parse.Query("CheckIn");
    query.equalTo("objectId", currentUser.get("currentCheckIn"));
    query.find({
      success: function(results) {
        if (results.length > 0) {
          var item = results[0];
          var addDate = new Date();
          var addString = addDate.toLocaleString();
          item.set("timeOut", addDate);
          item.set("stringTimeOut", addString);
          item.save();
        }
      },
      error: function(error) {
        console.log(error.message);
      }
    });
  }


  // The main view for the app
  var AppView = Parse.View.extend({
    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("#todoapp"),

    initialize: function() {
      this.render();
    },

    render: function() {
      var user = Parse.User.current();
      if (user) {
        new CheckInView();
      } else {
        new LogInView();
      }
    }
  });

  var AppRouter = Parse.Router.extend({
    routes: {
      "all": "all",
      "active": "active",
      "completed": "completed"
    },

    initialize: function(options) {
    },

    all: function() {
      state.set({ filter: "all" });
    },

    active: function() {
      state.set({ filter: "active" });
    },

    completed: function() {
      state.set({ filter: "completed" });
    }
  });

  var state = new AppState;

  new AppRouter;
  new AppView;
  Parse.history.start();
});

