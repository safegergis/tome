package com.safegergis.tome_users;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloWorld {
    private String greeting = "hello world";

    @GetMapping("/hello")
    public String hello() {

        return greeting;
    }
}
