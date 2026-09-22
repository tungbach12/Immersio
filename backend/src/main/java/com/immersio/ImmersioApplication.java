package com.immersio;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.modulith.Modulithic;

@SpringBootApplication
@Modulithic
public class ImmersioApplication {

    public static void main(String[] args) {
        SpringApplication.run(ImmersioApplication.class, args);
    }
}
