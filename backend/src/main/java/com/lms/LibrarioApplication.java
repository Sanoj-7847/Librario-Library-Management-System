package com.lms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.bind.annotation.CrossOrigin;

@SpringBootApplication
@CrossOrigin(origins = "http://localhost:5174")
@EnableScheduling
public class LibrarioApplication {
    
   public static void main(String[] args) {
        SpringApplication.run(LibrarioApplication.class, args);
        System.out.println("\n" +
                "╔═══════════════════════════════════════════╗\n" +
                "║   Librario - Library Management System    ║\n" +
                "║   Backend Server Started Successfully     ║\n" +
                "║   http://localhost:1205                   ║\n" +
                "╚═══════════════════════════════════════════╝\n");
    }
}
