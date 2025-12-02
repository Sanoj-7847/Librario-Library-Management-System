package com.lms.service;

import com.lms.entity.Category;
import com.lms.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CategoryService {
    private final CategoryRepository repo;

    public CategoryService(CategoryRepository repo) {
        this.repo = repo;
    }

    public List<Category> listAll() {
        return repo.findAll();
    }

    public List<Category> search(String q) {
        if (q == null || q.isBlank())
            return listAll();
        return repo.findByNameContainingIgnoreCase(q);
    }

    public Category get(Long id) {
        return repo.findById(id).orElse(null);
    }

    public Category create(Category c) {
        // optional: check duplicate
        return repo.save(c);
    }

    public Category update(Long id, Category c) {
        return repo.findById(id).map(existing -> {
            existing.setName(c.getName());
            existing.setDescription(c.getDescription());
            return repo.save(existing);
        }).orElse(null);
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }
}