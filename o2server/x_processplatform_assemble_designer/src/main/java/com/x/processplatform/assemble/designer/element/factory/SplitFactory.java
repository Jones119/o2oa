package com.x.processplatform.assemble.designer.element.factory;

import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import com.x.processplatform.assemble.designer.AbstractFactory;
import com.x.processplatform.assemble.designer.Business;
import com.x.processplatform.core.entity.element.Split;
import com.x.processplatform.core.entity.element.Split_;

public class SplitFactory extends AbstractFactory {

	public SplitFactory(Business business) throws Exception {
		super(business);
	}

	public List<String> listWithProcess(String processId) throws Exception {
		EntityManager em = this.entityManagerContainer().get(Split.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<String> cq = cb.createQuery(String.class);
		Root<Split> root = cq.from(Split.class);
		Predicate p = cb.equal(root.get(Split_.process), processId);
		cq.select(root.get(Split_.id)).where(p);
		return em.createQuery(cq).getResultList();
	}

	public List<Split> listWithProcessObject(String processId) throws Exception {
		EntityManager em = this.entityManagerContainer().get(Split.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<Split> cq = cb.createQuery(Split.class);
		Root<Split> root = cq.from(Split.class);
		Predicate p = cb.equal(root.get(Split_.process), processId);
		cq.select(root).where(p);
		return em.createQuery(cq).getResultList();
	}

	/** 查找使用表单的split */
	public List<String> listWithForm(String formId) throws Exception {
		EntityManager em = this.entityManagerContainer().get(Split.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<String> cq = cb.createQuery(String.class);
		Root<Split> root = cq.from(Split.class);
		Predicate p = cb.equal(root.get(Split_.form), formId);
		cq.select(root.get(Split_.id)).where(p);
		return em.createQuery(cq).getResultList();
	}
}