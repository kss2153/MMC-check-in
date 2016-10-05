$(function() {

  Parse.$ = jQuery;

  // Initialize Parse with Parse application javascript keys
  Parse.initialize('id1456264732846282', 'key647328467329438');
  Parse.serverURL = 'https://musical-mentors.herokuapp.com/parse';

  // This is the transient application state, not persisted on Parse
  var AppState = Parse.Object.extend("AppState", {
    defaults: {
      filter: "all"
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
      "click #back-login": "logIn"
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
            new LogInView();
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

    logIn: function() {
      new LogInView();
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
          new SignUpView();
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

  // The main view for the app
  var AppView = Parse.View.extend({
    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("#todoapp"),

    initialize: function() {
      this.render();
    },

    render: function() {
      if (Parse.User.current()) {
        Parse.User.logOut();
        new LogInView();
      } else {
        new SignUpView();
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

