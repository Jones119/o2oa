package com.x.processplatform.service.processing.factory;

import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import com.x.processplatform.core.entity.content.Task;
import com.x.processplatform.core.entity.content.Task_;
import com.x.processplatform.service.processing.AbstractFactory;
import com.x.processplatform.service.processing.Business;

public class TaskFactory extends AbstractFactory {

    public TaskFactory(Business business) throws Exception {
        super(business);
    }

    public List<String> listWithWork(String id) throws Exception {
        EntityManager em = this.entityManagerContainer().get(Task.class);
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<String> cq = cb.createQuery(String.class);
        Root<Task> root = cq.from(Task.class);
        Predicate p = cb.equal(root.get(Task_.work), id);
        cq.select(root.get(Task_.id)).where(p);
        return em.createQuery(cq).getResultList();
    }

}