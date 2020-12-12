var app = require("../server");
var request = require("supertest");

  it("Login Endpoint", (done) => {
    request(app)
      .post('/api/login')
      .set('content-type', 'application/x-www-form-urlencoded')
      .send({
        username: "test",
        password: "testing123",
      })
      .expect(302)
      .end((err, res) => {
        done(err);
      });
  });
  it("Register Endpoint", (done) => {
    request(app)
      .post('/api/register')
      .set('content-type', 'application/x-www-form-urlencoded')
      .send({
        name: "test",
        username: "test",
        password: "testing123",
      })
      .expect(302)
      .end((err, res) => {
        done(err);
      });
  });
  it("Update Endpoint", (done) => {
    request(app)
      .post('/api/update')
      .set('content-type', 'application/x-www-form-urlencoded')
      .send({
        name: "test",
        description: "test description",
        image: "testing123.png",
      })
      .expect("not logged in")
      .end((err, res) => {
        done(err);
      });
  });
  it("Logout Endpoint", (done) => {
    request(app)
      .get('/api/logout')
      .expect(302)
      .end((err, res) => {
        done(err);
      });
  });