package com.employee.controller;

import com.employee.entity.User;
import com.employee.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody User user) {

        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists");
        }

        userRepository.save(user);

        return ResponseEntity.ok("Signup Successful");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String,String> login) {

        Optional<User> user = userRepository.findByUsername(login.get("username"));

        if(user.isEmpty()){
            return ResponseEntity.badRequest().body("Invalid Username");
        }

        if(!user.get().getPassword().equals(login.get("password"))){
            return ResponseEntity.badRequest().body("Invalid Password");
        }

        Map<String,Object> response=new HashMap<>();

        response.put("userId",user.get().getUserId());
        response.put("username",user.get().getUsername());
        response.put("fullName",user.get().getFullName());
        response.put("email",user.get().getEmail());
        response.put("role",user.get().getRole());

        return ResponseEntity.ok(response);
    }
}