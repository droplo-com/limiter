/**
 * @author Michał Żaloudik <ponury.kostek@gmail.com>
 */
"use strict";
const assert = require("assert");
const Limiter = require("../index");
describe("Limiter", () => {
	describe("constructor", () => {
		it("should throw on incorrect 'concurrency' parameter", () => {
			assert.throws(() => {
				new Limiter({concurrency: ""});
			});
		});
		it("should throw on incorrect 'done' parameter", () => {
			assert.throws(() => {
				new Limiter({done: ""});
			});
		});
		it("should throw on incorrect 'drain' parameter", () => {
			assert.throws(() => {
				new Limiter({drain: ""});
			});
		});
		it("should set default concurrency to infinity", () => {
			const limiter = new Limiter();
			assert.strictEqual(limiter.concurrency, Infinity);
		});
	});
	it("drained should fire after all jobs are done", async () => {
		const promises = [];

		const jobs = Array.from({length: 9}).map(() => (done) => promises.push(new Promise((resolve) => {
			setTimeout(() => {
				resolve();
				done();
			}, Math.random() * 10 + 1);
		})));

		let resolve;
		const donePromise = new Promise((_resolve) => {
			resolve = _resolve;
		});

		const limiter = new Limiter({
			concurrency: 4,
			drain: () => {
				resolve();
			},
			done: () => {

			}
		});
		jobs.forEach(job => limiter.add(job));

		let allDone = false;

		await Promise.all([
			Promise.all(promises).then(() => allDone = true),
			donePromise.then(() => {
				if (!allDone) {
					throw new Error("drained fired before all done");
				}
			})
		]);
	});
});
