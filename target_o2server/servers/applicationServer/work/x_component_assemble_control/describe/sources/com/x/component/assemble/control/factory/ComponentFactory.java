package com.x.component.assemble.control.factory;

import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import com.x.component.assemble.control.AbstractFactory;
import com.x.component.assemble.control.Business;
import com.x.component.core.entity.Component;
import com.x.component.core.entity.Component_;

public class ComponentFactory extends AbstractFactory {

	public ComponentFactory(Business business) {
		super(business);
	}

	public List<String> listVisiable() throws Exception {
		EntityManager em = this.entityManagerContainer().get(Component.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<String> cq = cb.createQuery(String.class);
		Root<Component> root = cq.from(Component.class);
		Predicate p = cb.equal(root.get(Component_.visible), Boolean.TRUE);
		cq.where(p).select(root.get(Component_.id));
		return em.createQuery(cq).getResultList();
	}

}