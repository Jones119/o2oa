package com.x.organization.assemble.personal.jaxrs.reset;

import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import com.x.base.core.container.EntityManagerContainer;
import com.x.base.core.project.jaxrs.StandardJaxrsAction;
import com.x.organization.core.entity.Person;
import com.x.organization.core.entity.Person_;

abstract class BaseAction extends StandardJaxrsAction {
	Boolean credentialExisted(EntityManagerContainer emc, String credential) throws Exception {
		EntityManager em = emc.get(Person.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<Long> cq = cb.createQuery(Long.class);
		Root<Person> root = cq.from(Person.class);
		Predicate p = cb.equal(root.get(Person_.name), credential);
		p = cb.or(p, cb.equal(root.get(Person_.mobile), credential));
		p = cb.or(p, cb.equal(root.get(Person_.id), credential));
		cq.select(cb.count(root.get(Person_.id))).where(p);
		if (em.createQuery(cq).getSingleResult() == 1) {
			return true;
		} else {
			return false;
		}
	}
}