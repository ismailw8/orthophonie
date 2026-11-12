package com.orthophoniste.auth.repository;

import com.orthophoniste.auth.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;
import java.util.List;
import com.orthophoniste.auth.model.Role;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRoleOrderByLastNameAscFirstNameAsc(Role role);
}
