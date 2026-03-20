package com.hrcloud.identity;

import com.hrcloud.identity.entity.User;
import com.hrcloud.identity.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class IdentityServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(IdentityServiceApplication.class, args);
    }

    @Bean
    public CommandLineRunner runner(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.findByUsername("admin").isEmpty()) {
                User admin = User.builder()
                        .username("admin")
                        .password(passwordEncoder.encode("admin123"))
                        .email("admin@hrcloud.com")
                        .fullName("System Admin")
                        .role(User.Role.ADMIN)
                        .isActive(true)
                        .build();
                userRepository.save(admin);
                System.out.println("✅ Default admin user created successfully.");
            } else {
                User admin = userRepository.findByUsername("admin").get();
                admin.setPassword(passwordEncoder.encode("admin123"));
                userRepository.save(admin);
                System.out.println("✅ Admin password reset to 'admin123' successfully.");
            }
        };
    }
}
