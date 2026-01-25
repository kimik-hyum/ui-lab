export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const delayWithError = (ms: number, shouldFail: boolean) => new Promise((resolve, reject) => {
    setTimeout(() => {
        if (shouldFail) {
            reject(new Error("Simulated Checkpoint Failure"));
        } else {
            resolve(true);
        }
    }, ms);
});
