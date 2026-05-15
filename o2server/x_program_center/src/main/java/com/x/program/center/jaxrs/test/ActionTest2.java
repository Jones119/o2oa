package com.x.program.center.jaxrs.test;

import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;

import com.x.base.core.container.EntityManagerContainer;
import com.x.base.core.container.factory.EntityManagerContainerFactory;
import com.x.base.core.project.gson.GsonPropertyObject;
import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.EffectivePerson;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;
import com.x.program.center.core.entity.Captcha;
import com.x.program.center.core.entity.Captcha_;

class ActionTest2 extends BaseAction {

	private static final Logger LOGGER = LoggerFactory.getLogger(ActionTest2.class);

	ActionResult<Wo> execute(EffectivePerson effectivePerson) throws Exception {

		LOGGER.debug("execute:{}.", effectivePerson::getDistinguishedName);
		ActionResult<Wo> result = new ActionResult<>();
		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			EntityManager em = emc.get(Captcha.class);
			CriteriaBuilder cb = em.getCriteriaBuilder();
			CriteriaQuery<Captcha> cq = cb.createQuery(Captcha.class);
			Root<Captcha> root = cq.from(Captcha.class);
			cq.select(root);
			Subquery<String> subquery = cq.subquery(String.class);
			Root<Captcha> subroot = subquery.from(Captcha.class);
			Predicate subPredicate = cb.equal(subroot.get(Captcha_.answer), root.get(Captcha_.answer));
			subquery.where(subPredicate);
			subquery.select(cb.greatest(subroot.get(Captcha_.id)));
			cq.where(cb.equal(root.get(Captcha_.id), subquery)).orderBy(cb.asc(root.get(Captcha_.createTime)));
			List<Captcha> list = em.createQuery(cq).getResultList();
			System.out.println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
			System.out.println(cq.toString());
			System.out.println(gson.toJson(list));
			System.out.println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
		}
		return result;
	}

	public class Wo extends GsonPropertyObject {

	}

}
