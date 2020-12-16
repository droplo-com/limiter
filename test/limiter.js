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
	it("should do jobs in priority order", async () => {
		const expectedOrder = [
			{
				job: 1,
				priority: -4
			},
			{
				job: 4,
				priority: -4
			},
			{
				job: 6,
				priority: -3
			},
			{
				job: 2,
				priority: -1
			},
			{
				job: 8,
				priority: -1
			},
			{
				job: 0,
				priority: 0
			},
			{
				job: 3,
				priority: 1
			},
			{
				job: 5,
				priority: 1
			},
			{
				job: 9,
				priority: 1
			},
			{
				job: 7,
				priority: 2
			}
		];
		const actualOrder = [];

		const limiter = new Limiter({
			concurrency: 0
		});
		const jobs = [
			0,
			-4,
			-1,
			1,
			-4,
			1,
			-3,
			2,
			-1,
			1
		];
		jobs.forEach((priority, id) => limiter.add(id, priority));
		limiter.jobs.forEach((t) => {
			actualOrder.push(t.value);
		});
		assert.strictEqual(jobs.length, limiter.jobs.length);
		assert.deepStrictEqual(actualOrder, expectedOrder);
	});
});
