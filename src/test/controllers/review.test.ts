import bodyParser from 'body-parser';
import express from 'express';
import sinon from 'sinon';
import chai from 'chai';
import chaiHttp from 'chai-http';
import routers from 'src/routers/reviews';
import Review from 'src/model/review';
import { ObjectId } from 'mongodb';
import mongoSetup from '../mongoSetup';

import log4js from 'log4js';

const { expect } = chai;

chai.use(chaiHttp);
chai.should();

const sandbox = sinon.createSandbox();

const app = express();

app.use(bodyParser.json());
app.use('/', routers);

describe('Review controller - createReview', () => {

    afterEach(() => {
        sandbox.restore();
    });

    it('should save a new review', (done) => {
        const reviewIdAfterSave = new ObjectId();
        const reviewData = {
            title: "New Review",
            text: "Some text",
            movieId: 1,
        };

        sandbox.stub(global, 'fetch').callsFake((input: RequestInfo | URL) => {
            let url = '';
            if (typeof input === 'string') {
                url = input;
            } else if (input instanceof URL) {
                url = input.toString();
            } else if (input instanceof Request) {
                url = input.url;
            }

            if (url === 'http://localhost:8080/api/movie/1') {
                return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
            }
            return Promise.reject(new Error('Movie not found'));
        });

        const saveOneStub = sandbox.stub(Review.prototype, 'save')
        saveOneStub.resolves({
            ...reviewData,
            _id: reviewIdAfterSave
        });
        sandbox.stub(Review, 'findOne').resolves(null);

        chai.request(app)
            .post('/')
            .send(reviewData)
            .end((err, res) => {
                if (err) {
                    console.error("Error: ", err)
                    log4js.getLogger().error("Error: ", err)
                } else {
                    console.log("Response status: ", res.status);
                    console.log("Response body: ", res.body);
                }
                try {
                    res.should.have.status(201);
                    expect(res.body).to.have.property("id");
                    expect(res.body.id).to.equal(reviewIdAfterSave.toString());
                    done();
                } catch (error) {
                    done(error)
                }
            });
    },
    );

    it('should return an error if required fields are missing', (done) => {
        const reviewData = {
            text: "Missing title",
            movieId: 1
        };

        chai.request(app)
            .post('/')
            .send(reviewData)
            .end((_, res) => {
                res.should.have.status(500);
                expect(res.body).to.have.property('message').that.includes('Title, text and movieId are required');
                done();
            });
    });
});

const id1 = new ObjectId();
const id2 = new ObjectId();
const id3 = new ObjectId();
const review1 = new Review({
    _id: id1,
    title: "Review1",
    text: "Text1",
    movieId: 1
});
const review2 = new Review({
    _id: id2,
    title: "Review2",
    text: "Text2",
    movieId: 1
});
const review3 = new Review({
    _id: id3,
    title: "Review3",
    text: "Text3",
    movieId: 2
});

describe('Review controller - getAllMovieReviews', () => {

    before(async () => {
        await mongoSetup;

        await review1.save();
        await review2.save();
        await review3.save();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should return all reviews for a movie', (done) => {
        const query = { movie: 1, size: 10, from: 1 };

        chai.request(app)
            .get('/')
            .query(query)
            .end((_, res) => {
                console.log("Response status: ", res.status);
                console.log("Response body: ", res.body);
                res.should.have.status(200);
                expect(res.body).to.be.an('object');
                expect(res.body.reviews).to.be.an('array').that.has.lengthOf(2);
                expect(res.body.reviews[0]).to.have.property('title', 'Review2');
                expect(res.body.reviews[1]).to.have.property('title', 'Review1');
                done();
            });
    });

    it('should return an error for invalid query params', (done) => {
        const query = { movie: 'invalid', size: 10, from: 1 };

        chai.request(app)
            .get('/')
            .query(query)
            .end((_, res) => {
                res.should.have.status(500);
                expect(res.body).to.have.property('message').that.includes('Missing or wrong params in query');
                done();
            });
    });
});

describe('Review controller - countReviewsInMovies', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('should count reviews for given movie IDs', (done) => {
        const movieIds = [1, 2];
        const reviewCounts = {
            1: 5,
            2: 2
        };

        sandbox.stub(Review, 'aggregate').resolves([
            { _id: 1, count: 5 },
            { _id: 2, count: 2 }
        ]);

        chai.request(app)
            .post('/_count')
            .send({ movieIds })
            .end((_, res) => {
                res.should.have.status(200);
                expect(res.body).to.deep.equal(reviewCounts);
                done();
            });
    });

    it('should return an error if movieIds is not an array', (done) => {
        const movieIds = "invalid";

        chai.request(app)
            .post('/_count')
            .send({ movieIds })
            .end((_, res) => {
                res.should.have.status(400);
                expect(res.body).to.have.property('message').that.includes('MovieIds must be an array');
                done();
            });
    });
});

