package com.x.program.center.factory;

import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import com.x.organization.core.entity.Role;
import com.x.organization.core.entity.Role_;
import com.x.program.center.AbstractFactory;
import com.x.program.center.Business;

public class RoleFactory extends AbstractFactory {

	public RoleFactory(Business business) throws Exception {
		super(business);
	}


  public List<Role> listRoleByPersonId(String personId) throws Exception {
    EntityManager em = this.entityManagerContainer().get(Role.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<Role> cq = cb.createQuery(Role.class);
		Root<Role> root = cq.from(Role.class);
		Predicate p = cb.isMember(personId, root.get(Role_.personList));
		return em.createQuery(cq.where(p)).getResultList();
  }
  
}
