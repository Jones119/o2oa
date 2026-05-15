package com.x.processplatform.assemble.designer.element.factory;

import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import com.x.processplatform.assemble.designer.AbstractFactory;
import com.x.processplatform.assemble.designer.Business;
import com.x.processplatform.core.entity.element.Parallel;
import com.x.processplatform.core.entity.element.Parallel_;

public class ParallelFactory extends AbstractFactory {

	public ParallelFactory(Business business) throws Exception {
		super(business);
	}

	public List<String> listWithProcess(String processId) throws Exception {
		EntityManager em = this.entityManagerContainer().get(Parallel.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<String> cq = cb.createQuery(String.class);
		Root<Parallel> root = cq.from(Parallel.class);
		Predicate p = cb.equal(root.get(Parallel_.process), processId);
		cq.select(root.get(Parallel_.id)).where(p);
		return em.createQuery(cq).getResultList();
	}

	public List<Parallel> listWithProcessObject(String processId) throws Exception {
		EntityManager em = this.entityManagerContainer().get(Parallel.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<Parallel> cq = cb.createQuery(Parallel.class);
		Root<Parallel> root = cq.from(Parallel.class);
		Predicate p = cb.equal(root.get(Parallel_.process), processId);
		cq.select(root).where(p);
		return em.createQuery(cq).getResultList();
	}

	/** 查找使用表单的parallel */
	public List<String> listWithForm(String formId) throws Exception {
		EntityManager em = this.entityManagerContainer().get(Parallel.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<String> cq = cb.createQuery(String.class);
		Root<Parallel> root = cq.from(Parallel.class);
		Predicate p = cb.equal(root.get(Parallel_.form), formId);
		cq.select(root.get(Parallel_.id)).where(p);
		return em.createQuery(cq).getResultList();
	}
}