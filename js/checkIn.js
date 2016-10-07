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

      user.signUp(null, {
        success: function(user) {
          new LessonInfoView();
          self.undelegateEvents();
          delete self;
        },

        error: function(user, error) {
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
      this.render();
    },

    logIn: function(e) {
      var self = this;
      var username = this.$("#login-username").val();
      var password = this.$("#login-password").val();
      
      Parse.User.logIn(username, password, {
        success: function(user) {
          new CheckInView();
          self.undelegateEvents();
          delete self;
        },

        error: function(user, error) {
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

  var started = false;
  var CheckInView = Parse.View.extend({
    events: {
      "click #see-checkins": "viewCheckIns",
      "click #back-info": "backToInfo",
      "click #back-login": "logIn",
      "click #checkin-button": "checkIn"
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
      var date = new Date();
      currentUser.set("timeIn", date);
      currentUser.set("checkedIn", !checked);
      currentUser.save(null, {
          success: function(user) {
            if (checked) {
              this.$('#checkin-button').html("Check In");
            } else {
              console.log("create");
              //self.createNewCheckIn;
              var newCheckIn = new Parse.Object("CheckIn");
              newCheckIn.set("mentorName", currentUser.get("firstName") + " " + currentUser.get("lastName"));
              newCheckIn.set("studentName", currentUser.get("studentName"));
              newCheckIn.set("parentName", currentUser.get("studentParentName"));
              newCheckIn.set("timeIn", currentUser.get("timeIn"));
              var timeInString = currentUser.get("timeIn").toLocaleString();;
              newCheckIn.set("stringTimeIn", timeInString);
              //var testNum = 6000 * currentUser.get("lessonLength");
              //console.log(testNum);
              //var newDate = currentUser.get("timeIn") + 6000 * currentUser.get("lessonLength");
              //var out = new Date(""+newDate);
              //newCheckIn.set("timeOut", out);
              newCheckIn.save(null, {
                success: function(newCheckIn) {
                  console.log("successfully added checkin");
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

    viewCheckIns: function() {
      new CheckInListView();
    },

    logIn: function() {
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
        return;
      }

      if (checked) {
        this.$('#checkin-button').html("Check Out");
      } else {
        this.$('#checkin-button').html("Check In");
      }
    },

    createNewCheckIn: function() {
      console.log("hello");
      var currentUser = Parse.User.current();
      var newCheckIn = new Parse.Object("CheckIn");
      newCheckIn.set("mentorName", currentUser.get("firstName") + currentUser.get("lastName"));
      newCheckIn.set("studentName", currentUser.get("studentName"));
      newCheckIn.set("parentName", currentUser.get("studentParentName"));
      newCheckIn.set("timeIn", currentUser.get("timeIn"));
      newCheckIn.set("timeOut", currentUser.get("timeIn") + 6000 * currentUser.get("lessonLength"));
      newCheckIn.save(null, {
        success: function(newCheckIn) {
          console.log("successfully added checkin");
        },
        error: function(newCheckIn, error) {
          console.log(error.message);
        }
      });
    },

    render: function() {
      this.$el.html(_.template($("#checkin-template").html()));
      this.delegateEvents();
    }
  });




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
        /*console.log(user.get("username"));
        if (user.get("username") == null) {
          Parse.User.logOut();
          new LogInView();
        } else {
          //Parse.User.logOut();
          new CheckInView();
        }*/
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

