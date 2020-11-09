/**
 * @author Michał Żaloudik <ponury.kostek@gmail.com>
 */
"use strict";

const kDone = Symbol("kDone");
const kRun = Symbol("kRun");
const kOnDone = Symbol("kOnDone");
const kOnDrain = Symbol("kOnDrain");

/**
 * Base on https://github.com/websockets/ws/blob/6df06d9751937e1bed526644d468a5be31ef33cc/lib/limiter.js
 */
class Limiter {
	/**
	 * Creates a new `Limiter`.
	 * @param {Object} [options]
	 * @param {Number} [options.concurrency] The maximum number of jobs allowed to run concurrently
	 * @param {function} [options.drain] Called each time queue is drain
	 * @param {function} [options.done] Called each time job is done, job passed as
	 */
	constructor({concurrency, drain, done} = {}) {
		if (concurrency !== undefined && (typeof concurrency !== "number" || isNaN(concurrency))) {
			throw new TypeError("concurrency");
		}
		if (drain !== undefined && typeof drain !== "function") {
			throw new TypeError("drain");
		}
		if (done !== undefined && typeof done !== "function") {
			throw new TypeError("done");
		}
		this[kDone] = () => {
			this.pending--;
			if (typeof this[kOnDone] === "function") {
				this[kOnDone]();
			}
			if (!this.pending && !this.jobs.length) {
				if (typeof this[kOnDrain] === "function") {
					this[kOnDrain]();
				}
			}
			this[kRun]();
		};
		this[kOnDrain] = drain;
		this[kOnDone] = done;
		this.concurrency = concurrency || Infinity;
		this.jobs = [];
		this.pending = 0;
	}

	/**
	 * Adds a job to the queue.
	 *
	 * @public
	 */
	add(job) {
		this.jobs.push(job);
		this[kRun]();
	}

	/**
	 * Removes a job from the queue and runs it if possible.
	 *
	 * @private
	 */
	[kRun]() {
		if (this.pending >= this.concurrency) {
			return;
		}

		if (this.jobs.length) {
			const job = this.jobs.shift();

			this.pending++;
			job(this[kDone]);
		}
	}
}

module.exports = Limiter;
