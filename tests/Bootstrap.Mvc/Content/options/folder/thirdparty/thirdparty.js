function ThirdPartyFibonacci(number) {
    if (number == 1) {
        return 1;
    } else {
        return Fibonacci(number - 1) + Fibonacci(number - 2);
    }
}