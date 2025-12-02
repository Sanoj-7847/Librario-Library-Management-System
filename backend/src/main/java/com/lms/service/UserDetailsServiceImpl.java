package com.lms.service;

import com.lms.entity.User;
import com.lms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // Trim email to avoid issues with leading/trailing spaces
        String sanitizedEmail = email.trim();

        User user = userRepository.findByEmail(sanitizedEmail)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found with email: " + sanitizedEmail
                ));

        return user; // User implements UserDetails
    }
}
